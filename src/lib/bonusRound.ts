import type { createServiceRoleClient } from "@/lib/supabase/server";
import type { AnswerTier, BonusRoundQuestionState, BonusRoundStatus } from "@/lib/types";

export const BONUS_ROUND_DURATION_MS = 5 * 60 * 1000;

// Shared by the start/status/answer/finish routes so they all agree on what
// "current state" means: the baseline from the main round (at most one
// credited answer per question) plus every distinct answer found during the
// bonus round itself — the round accepts unlimited distinct correct answers
// per question, so a question can rack up many.
export async function buildBonusRoundStatus(
  supabase: ReturnType<typeof createServiceRoleClient>,
  gameSessionId: string,
  dailySetId: string
): Promise<BonusRoundStatus> {
  const { data: bonusSession } = await supabase
    .from("bonus_round_sessions")
    .select("id, baseline_score, ends_at, completed_at, final_score")
    .eq("game_session_id", gameSessionId)
    .maybeSingle();

  if (!bonusSession) {
    return {
      active: false,
      baselineScore: 0,
      currentScore: 0,
      endsAt: null,
      completedAt: null,
      finalScore: null,
      questions: [],
    };
  }

  const [{ data: challenges }, { data: mainAnswers }, { data: bonusAnswers }] = await Promise.all([
    supabase.from("daily_challenges").select("id, slot").eq("daily_set_id", dailySetId).order("slot", { ascending: true }),
    supabase
      .from("submitted_answers")
      .select("challenge_id, matched_answer_id, score, tier, canonical_answer")
      .eq("session_id", gameSessionId)
      .eq("result", "accepted"),
    supabase
      .from("bonus_round_answers")
      .select("challenge_id, matched_answer_id, score, tier, canonical_answer")
      .eq("bonus_round_session_id", bonusSession.id)
      .eq("result", "accepted"),
  ]);

  const foundByChallenge = new Map<string, BonusRoundQuestionState["found"]>();
  const push = (
    challengeId: string,
    answerId: string | null,
    canonicalAnswer: string | null,
    score: number | null,
    tier: string | null,
    source: "main" | "bonus"
  ) => {
    if (!answerId || !canonicalAnswer || score == null || !tier) return;
    const list = foundByChallenge.get(challengeId) ?? [];
    list.push({ answerId, canonicalAnswer, score, tier: tier as AnswerTier, source });
    foundByChallenge.set(challengeId, list);
  };
  for (const a of mainAnswers ?? []) {
    push(a.challenge_id, a.matched_answer_id, a.canonical_answer, a.score, a.tier, "main");
  }
  for (const a of bonusAnswers ?? []) {
    push(a.challenge_id, a.matched_answer_id, a.canonical_answer, a.score, a.tier, "bonus");
  }

  const questions: BonusRoundQuestionState[] = (challenges ?? []).map((c) => ({
    challengeId: c.id,
    slot: c.slot,
    found: foundByChallenge.get(c.id) ?? [],
  }));

  const bonusEarned = (bonusAnswers ?? []).reduce((sum, a) => sum + (a.score ?? 0), 0);

  return {
    active: bonusSession.completed_at === null,
    baselineScore: bonusSession.baseline_score,
    currentScore: bonusSession.baseline_score + bonusEarned,
    endsAt: bonusSession.ends_at,
    completedAt: bonusSession.completed_at,
    finalScore: bonusSession.final_score,
    questions,
  };
}
