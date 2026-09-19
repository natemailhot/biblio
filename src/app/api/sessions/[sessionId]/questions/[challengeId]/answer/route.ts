import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAnswer, findMatchingAnswer } from "@/lib/answers/match";
import { findFuzzySuggestion } from "@/lib/answers/fuzzyMatch";
import { findSemanticSuggestion } from "@/lib/answers/embeddings";
import type { ChallengeAnswer, SubmitQuestionAnswerResponse } from "@/lib/types";

const TIMED_MODE_GRACE_MS = 2000;

// Records a guess for one question. Wrong guesses don't lock the question —
// the player may keep guessing until they get it right or the per-question
// timer runs out. Once a correct guess is recorded, further submissions are
// rejected. An empty rawInput is treated as an explicit skip (e.g. the
// client's timer ran out) rather than an error.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; challengeId: string }> }
) {
  const { sessionId, challengeId } = await params;
  const body = await req.json().catch(() => null);
  const rawInput = (body?.rawInput as string | undefined) ?? "";

  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, daily_set_id, completed_at, ascent_score, total_score")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.completed_at) {
    return NextResponse.json({ error: "Session already completed" }, { status: 409 });
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("daily_challenges")
    .select("id, daily_set_id, slot, duration_seconds, answer_set_version, daily_gem_answer_id")
    .eq("id", challengeId)
    .single();

  if (challengeError || !challenge || challenge.daily_set_id !== session.daily_set_id) {
    return NextResponse.json({ error: "Question not found in this session" }, { status: 404 });
  }

  const { data: alreadyCorrect } = await supabase
    .from("submitted_answers")
    .select("id")
    .eq("session_id", sessionId)
    .eq("challenge_id", challengeId)
    .eq("result", "accepted")
    .maybeSingle();

  if (alreadyCorrect) {
    return NextResponse.json({ error: "This question was already answered correctly" }, { status: 409 });
  }

  const isSkip = !rawInput.trim();

  if (!isSkip) {
    const { data: start } = await supabase
      .from("session_question_starts")
      .select("started_at")
      .eq("session_id", sessionId)
      .eq("challenge_id", challengeId)
      .maybeSingle();

    if (start) {
      const elapsedMs = Date.now() - new Date(start.started_at).getTime();
      const allowedMs = challenge.duration_seconds * 1000 + TIMED_MODE_GRACE_MS;
      if (elapsedMs > allowedMs) {
        return NextResponse.json({ error: "Time is up for this question" }, { status: 403 });
      }
    }
  }

  const submittedAtMs = Date.now();
  let response: SubmitQuestionAnswerResponse;
  let matchedAnswerId: string | null = null;
  let matchedExplanation: string | null = null;
  let matchedReferences: ChallengeAnswer["references"] | null = null;
  let normalizedInput = "";

  if (isSkip) {
    response = { result: "invalid", score: 0, message: "No answer submitted." };
  } else {
    normalizedInput = normalizeAnswer(rawInput);

    const { data: answerRows, error: answersError } = await supabase
      .from("challenge_answers")
      .select(
        "id, challenge_id, answer_set_version, canonical_answer, normalized_answer, aliases, score, tier, references, explanation, inclusion_notes, exclusions, active, is_catholic_only, embedding"
      )
      .eq("challenge_id", challengeId)
      .eq("answer_set_version", challenge.answer_set_version)
      .eq("active", true);

    if (answersError) {
      return NextResponse.json({ error: "Could not load answer set" }, { status: 500 });
    }

    const answers: ChallengeAnswer[] = (answerRows ?? []).map((row) => ({
      id: row.id,
      challengeId: row.challenge_id,
      answerSetVersion: row.answer_set_version,
      canonicalAnswer: row.canonical_answer,
      normalizedAnswer: row.normalized_answer,
      aliases: row.aliases ?? [],
      score: row.score,
      tier: row.tier,
      references: row.references ?? [],
      explanation: row.explanation,
      inclusionNotes: row.inclusion_notes,
      exclusions: row.exclusions ?? [],
      active: row.active,
      isCatholicOnly: row.is_catholic_only,
      embedding: (row as { embedding?: number[] | null }).embedding ?? null,
    }));

    const matched = findMatchingAnswer(normalizedInput, answers);

    if (!matched) {
      const suggestion =
        findFuzzySuggestion(normalizedInput, answers) ?? (await findSemanticSuggestion(rawInput, answers));
      response = suggestion
        ? {
            result: "invalid",
            score: 0,
            message: `Not quite — did you mean "${suggestion}"?`,
            suggestion,
          }
        : { result: "invalid", score: 0, message: "Not in today's answer set—try another day." };
    } else {
      matchedAnswerId = matched.id;
      matchedExplanation = matched.explanation;
      matchedReferences = matched.references;
      response = {
        result: "accepted",
        score: matched.score,
        canonicalAnswer: matched.canonicalAnswer,
        tier: matched.tier,
        message: `+${matched.score} — ${matched.canonicalAnswer}`,
      };
    }
  }

  const { error: insertError } = await supabase.from("submitted_answers").insert({
    session_id: sessionId,
    challenge_id: challengeId,
    slot: challenge.slot,
    answer_set_version: challenge.answer_set_version,
    raw_input: rawInput,
    normalized_input: normalizedInput,
    submitted_at_ms: submittedAtMs,
    matched_answer_id: matchedAnswerId,
    result: response.result,
    // Snapshot the scored outcome so results stay correct even if this
    // question's answer set is later edited/reversioned.
    score: response.result === "accepted" ? response.score : null,
    tier: response.result === "accepted" ? response.tier : null,
    canonical_answer: response.result === "accepted" ? response.canonicalAnswer : null,
    explanation: matchedExplanation,
    references: matchedReferences,
    is_daily_gem: matchedAnswerId !== null && matchedAnswerId === challenge.daily_gem_answer_id,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "This question was already answered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not record answer" }, { status: 500 });
  }

  if (response.result === "accepted") {
    await supabase
      .from("game_sessions")
      .update({
        ascent_score: session.ascent_score + response.score,
        total_score: session.total_score + response.score,
      })
      .eq("id", sessionId);
  }

  return NextResponse.json(response);
}
