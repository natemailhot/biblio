import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAnswer, findMatchingAnswer } from "@/lib/answers/match";
import { findFuzzySuggestion } from "@/lib/answers/fuzzyMatch";
import { findSemanticSuggestion } from "@/lib/answers/embeddings";
import type { ChallengeAnswer } from "@/lib/types";

const MAX_NOTE_LENGTH = 1000;

// Lets a player flag a specific question they believe they answered
// correctly, from the results screen. This never touches scoring itself —
// it only queues a review row, pre-triaged with a diagnostic computed by
// re-running the exact same matching pipeline the live answer route uses
// against their actual guess (which also catches the common case where the
// content gap has already been fixed since they played).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; challengeId: string }> }
) {
  const { sessionId, challengeId } = await params;
  const body = await req.json().catch(() => null);
  const playerNote = (body?.playerNote as string | undefined)?.trim().slice(0, MAX_NOTE_LENGTH) || null;

  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, daily_set_id")
    .eq("id", sessionId)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("daily_challenges")
    .select("id, daily_set_id, answer_set_version")
    .eq("id", challengeId)
    .single();
  if (challengeError || !challenge || challenge.daily_set_id !== session.daily_set_id) {
    return NextResponse.json({ error: "Question not found in this session" }, { status: 404 });
  }

  // The literal last row can be an empty timeout skip even when the player
  // made several real guesses before time ran out — find their last
  // non-empty guess, not just the last row.
  const { data: attempts } = await supabase
    .from("submitted_answers")
    .select("id, raw_input")
    .eq("session_id", sessionId)
    .eq("challenge_id", challengeId)
    .order("submitted_at_ms", { ascending: false });

  const lastAttempt = (attempts ?? []).find((a) => a.raw_input?.trim());
  const rawInput = lastAttempt?.raw_input?.trim();
  if (!lastAttempt || !rawInput) {
    return NextResponse.json({ error: "No guess found for this question" }, { status: 400 });
  }

  const { data: answerRows } = await supabase
    .from("challenge_answers")
    .select(
      "id, challenge_id, answer_set_version, canonical_answer, normalized_answer, aliases, score, tier, references, explanation, inclusion_notes, exclusions, active, is_catholic_only, embedding"
    )
    .eq("challenge_id", challengeId)
    .eq("answer_set_version", challenge.answer_set_version)
    .eq("active", true);

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

  const normalizedInput = normalizeAnswer(rawInput);
  const exactMatch = findMatchingAnswer(normalizedInput, answers)?.canonicalAnswer ?? null;
  const fuzzySuggestion = exactMatch ? null : findFuzzySuggestion(normalizedInput, answers);
  const semanticSuggestion = exactMatch || fuzzySuggestion ? null : await findSemanticSuggestion(rawInput, answers);

  const diagnostic = { exactMatch, fuzzySuggestion, semanticSuggestion };

  const { error: insertError } = await supabase.from("answer_protests").insert({
    session_id: sessionId,
    challenge_id: challengeId,
    submitted_answer_id: lastAttempt.id,
    raw_input: rawInput,
    player_note: playerNote,
    diagnostic,
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not save protest" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, diagnostic });
}
