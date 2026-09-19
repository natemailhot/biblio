import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AnswerTier, FoundAnswer, MissedAnswer, SessionResults } from "@/lib/types";

const MISSED_HIGH_VALUE_LIMIT = 5;

const EMPTY_TIER_COUNTS: Record<AnswerTier, number> = {
  familiar: 0,
  known: 0,
  "deep-cut": 0,
  "daily-gem": 0,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select(
      "id, challenge_id, answer_set_version, ascent_score, scripture_bonus_score, scripture_bonus_correct, total_score, completed_at"
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.completed_at) {
    return NextResponse.json({ error: "Session is not finished yet" }, { status: 409 });
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("daily_challenges")
    .select("canon_scope, daily_gem_answer_id, scripture_bonus_id")
    .eq("id", session.challenge_id)
    .single();

  if (challengeError || !challenge?.scripture_bonus_id) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const [{ data: answerRows }, { data: submittedRows }, { data: bonusRow }] = await Promise.all([
    supabase
      .from("challenge_answers")
      .select("id, canonical_answer, score, tier, references, explanation")
      .eq("challenge_id", session.challenge_id)
      .eq("answer_set_version", session.answer_set_version)
      .eq("active", true),
    supabase
      .from("submitted_answers")
      .select("matched_answer_id")
      .eq("session_id", sessionId)
      .eq("result", "accepted"),
    supabase
      .from("scripture_bonus")
      .select("display_text, book, reference_display, translation, context_note, bonus_points")
      .eq("id", challenge.scripture_bonus_id)
      .single(),
  ]);

  if (!bonusRow) {
    return NextResponse.json({ error: "Scripture Bonus not found" }, { status: 404 });
  }

  const foundIds = new Set((submittedRows ?? []).map((r) => r.matched_answer_id).filter(Boolean));

  const toFoundAnswer = (row: NonNullable<typeof answerRows>[number]): FoundAnswer => ({
    canonicalAnswer: row.canonical_answer,
    score: row.score,
    tier: row.tier,
    references: row.references ?? [],
    explanation: row.explanation,
  });

  const found: FoundAnswer[] = [];
  const missedCandidates: (MissedAnswer & { id: string })[] = [];
  const tierCounts: Record<AnswerTier, number> = { ...EMPTY_TIER_COUNTS };

  for (const row of answerRows ?? []) {
    if (foundIds.has(row.id)) {
      found.push(toFoundAnswer(row));
      tierCounts[row.tier as AnswerTier] += 1;
    } else {
      missedCandidates.push({ id: row.id, ...toFoundAnswer(row) });
    }
  }

  const missedHighValueAnswers: MissedAnswer[] = missedCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, MISSED_HIGH_VALUE_LIMIT)
    .map(({ canonicalAnswer, score, tier, references, explanation }) => ({
      canonicalAnswer,
      score,
      tier,
      references,
      explanation,
    }));

  const dailyGemRow = (answerRows ?? []).find((row) => row.id === challenge.daily_gem_answer_id);
  const dailyGem = dailyGemRow
    ? { ...toFoundAnswer(dailyGemRow), found: foundIds.has(dailyGemRow.id) }
    : null;

  const results: SessionResults = {
    totalScore: session.total_score,
    ascentScore: session.ascent_score,
    scriptureBonusScore: session.scripture_bonus_score,
    scriptureBonusCorrect: session.scripture_bonus_correct,
    acceptedCount: found.length,
    tierCounts,
    foundAnswers: found,
    missedHighValueAnswers,
    dailyGem,
    scriptureBonus: {
      displayText: bonusRow.display_text,
      book: bonusRow.book,
      referenceDisplay: bonusRow.reference_display,
      translation: bonusRow.translation,
      contextNote: bonusRow.context_note,
      bonusPoints: bonusRow.bonus_points,
    },
    canonScope: challenge.canon_scope,
  };

  return NextResponse.json(results);
}
