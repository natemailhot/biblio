import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAnswer, findMatchingAnswer } from "@/lib/answers/match";
import type { ChallengeAnswer, SubmitAnswerResponse } from "@/lib/types";

const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;
const TIMED_MODE_GRACE_MS = 2000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await req.json().catch(() => null);
  const rawInput = body?.rawInput as string | undefined;

  if (!rawInput || !rawInput.trim()) {
    return NextResponse.json({ error: "rawInput is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, challenge_id, mode, started_at, completed_at, dive_score, total_score, answer_set_version")
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
    .select("duration_seconds")
    .eq("id", session.challenge_id)
    .single();

  if (challengeError || !challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  // Server-side duration enforcement for timed mode.
  if (session.mode === "timed") {
    const elapsedMs = Date.now() - new Date(session.started_at).getTime();
    const allowedMs = challenge.duration_seconds * 1000 + TIMED_MODE_GRACE_MS;
    if (elapsedMs > allowedMs) {
      return NextResponse.json({ error: "Time is up for this round" }, { status: 403 });
    }
  }

  // Basic submission rate limiting.
  const { count: recentCount } = await supabase
    .from("submitted_answers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .gte("submitted_at_ms", Date.now() - RATE_LIMIT_WINDOW_MS);

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return NextResponse.json({ error: "Too many submissions, slow down" }, { status: 429 });
  }

  const normalizedInput = normalizeAnswer(rawInput);

  const { data: answerRows, error: answersError } = await supabase
    .from("challenge_answers")
    .select(
      "id, challenge_id, answer_set_version, canonical_answer, normalized_answer, aliases, score, tier, references, explanation, inclusion_notes, exclusions, active"
    )
    .eq("challenge_id", session.challenge_id)
    .eq("answer_set_version", session.answer_set_version)
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
  }));

  const matched = findMatchingAnswer(normalizedInput, answers);

  let response: SubmitAnswerResponse;
  const submittedAtMs = Date.now();

  if (!matched) {
    response = {
      result: "invalid",
      score: 0,
      message: "Not in today's answer set—try another.",
    };
  } else {
    // Prevent aliases of the same entity from being scored more than once.
    const { data: existingAccepted } = await supabase
      .from("submitted_answers")
      .select("id")
      .eq("session_id", sessionId)
      .eq("matched_answer_id", matched.id)
      .eq("result", "accepted")
      .limit(1);

    if (existingAccepted && existingAccepted.length > 0) {
      response = {
        result: "duplicate",
        score: 0,
        canonicalAnswer: matched.canonicalAnswer,
        message: `You already found "${matched.canonicalAnswer}".`,
      };
    } else {
      response = {
        result: "accepted",
        score: matched.score,
        canonicalAnswer: matched.canonicalAnswer,
        tier: matched.tier,
        message: `+${matched.score} — ${matched.canonicalAnswer}`,
      };
    }
  }

  await supabase.from("submitted_answers").insert({
    session_id: sessionId,
    raw_input: rawInput,
    normalized_input: normalizedInput,
    submitted_at_ms: submittedAtMs,
    matched_answer_id: matched?.id ?? null,
    result: response.result,
  });

  if (response.result === "accepted") {
    await supabase
      .from("game_sessions")
      .update({
        dive_score: session.dive_score + response.score,
        total_score: session.total_score + response.score,
      })
      .eq("id", sessionId);
  }

  return NextResponse.json(response);
}
