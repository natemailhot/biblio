import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAnswer, findMatchingAnswer } from "@/lib/answers/match";
import { findFuzzySuggestion } from "@/lib/answers/fuzzyMatch";
import { findSemanticSuggestion } from "@/lib/answers/embeddings";
import { buildBonusRoundStatus } from "@/lib/bonusRound";
import type { ChallengeAnswer, SubmitBonusRoundAnswerResponse } from "@/lib/types";

// Records a guess for one question during the bonus round. Unlike the main
// round, there's no per-question lock or single-guess limit here — a
// question accepts unlimited *distinct* correct answers (the goal is the
// highest cumulative sum), and a player can freely switch between all 5
// questions, guessing as many times as they want on each until the whole
// round's 5-minute clock (enforced server-side via
// bonus_round_sessions.ends_at) runs out. The only thing that's blocked is
// re-crediting the exact same answer twice, whether it was already found in
// the main round or earlier in this bonus round.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; challengeId: string }> }
) {
  const { sessionId, challengeId } = await params;
  const body = await req.json().catch(() => null);
  const rawInput = (body?.rawInput as string | undefined) ?? "";

  if (!rawInput.trim()) {
    return NextResponse.json({ error: "rawInput is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, daily_set_id")
    .eq("id", sessionId)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: bonusSession, error: bonusSessionError } = await supabase
    .from("bonus_round_sessions")
    .select("id, ends_at, completed_at")
    .eq("game_session_id", sessionId)
    .single();
  if (bonusSessionError || !bonusSession) {
    return NextResponse.json({ error: "Bonus round not started" }, { status: 404 });
  }
  if (bonusSession.completed_at || Date.now() > new Date(bonusSession.ends_at).getTime()) {
    return NextResponse.json({ error: "The bonus round has ended" }, { status: 403 });
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("daily_challenges")
    .select("id, daily_set_id, slot, answer_set_version")
    .eq("id", challengeId)
    .single();
  if (challengeError || !challenge || challenge.daily_set_id !== session.daily_set_id) {
    return NextResponse.json({ error: "Question not found in this session" }, { status: 404 });
  }

  // Every answer id already credited for this question, whether from the
  // main round or earlier in this bonus round — re-matching one of these
  // doesn't score again.
  const [{ data: mainFound }, { data: bonusFound }] = await Promise.all([
    supabase
      .from("submitted_answers")
      .select("matched_answer_id")
      .eq("session_id", sessionId)
      .eq("challenge_id", challengeId)
      .eq("result", "accepted"),
    supabase
      .from("bonus_round_answers")
      .select("matched_answer_id")
      .eq("bonus_round_session_id", bonusSession.id)
      .eq("challenge_id", challengeId)
      .eq("result", "accepted"),
  ]);
  const alreadyFoundIds = new Set(
    [...(mainFound ?? []), ...(bonusFound ?? [])].map((a) => a.matched_answer_id).filter((id): id is string => !!id)
  );

  const normalizedInput = normalizeAnswer(rawInput);

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

  let response: SubmitBonusRoundAnswerResponse;
  let matchedAnswerId: string | null = null;

  if (!matched) {
    const suggestion =
      findFuzzySuggestion(normalizedInput, answers) ?? (await findSemanticSuggestion(rawInput, answers));
    response = suggestion
      ? {
          result: "invalid",
          score: 0,
          message: `Not quite — did you mean "${suggestion}"?`,
          suggestion,
          currentScore: 0,
        }
      : { result: "invalid", score: 0, message: "Not in today's answer set.", currentScore: 0 };
  } else if (alreadyFoundIds.has(matched.id)) {
    response = {
      result: "duplicate",
      score: 0,
      canonicalAnswer: matched.canonicalAnswer,
      message: `You already found "${matched.canonicalAnswer}" — try another.`,
      currentScore: 0,
    };
  } else {
    matchedAnswerId = matched.id;
    response = {
      result: "accepted",
      score: matched.score,
      canonicalAnswer: matched.canonicalAnswer,
      tier: matched.tier,
      message: `+${matched.score} — ${matched.canonicalAnswer}`,
      currentScore: 0,
    };
  }

  await supabase.from("bonus_round_answers").insert({
    bonus_round_session_id: bonusSession.id,
    challenge_id: challengeId,
    slot: challenge.slot,
    raw_input: rawInput,
    normalized_input: normalizedInput,
    submitted_at_ms: Date.now(),
    matched_answer_id: matchedAnswerId,
    result: response.result,
    score: response.result === "accepted" ? response.score : null,
    tier: response.result === "accepted" ? (response.tier ?? null) : null,
    canonical_answer: response.result !== "invalid" ? (response.canonicalAnswer ?? null) : null,
    explanation: matched?.explanation ?? null,
    references: matched?.references ?? null,
  });

  const status = await buildBonusRoundStatus(supabase, sessionId, session.daily_set_id);
  response.currentScore = status.currentScore;

  return NextResponse.json(response);
}
