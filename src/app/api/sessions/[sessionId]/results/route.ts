import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { QuestionResult, SessionResults } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select(
      "id, daily_set_id, ascent_score, scripture_bonus_multiplier, scripture_bonus_level, scripture_bonus_correct, total_score, completed_at"
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.completed_at) {
    return NextResponse.json({ error: "Session is not finished yet" }, { status: 409 });
  }

  const { data: dailySet, error: dailySetError } = await supabase
    .from("daily_sets")
    .select("day_number, scripture_bonus_id")
    .eq("id", session.daily_set_id)
    .single();

  if (dailySetError || !dailySet?.scripture_bonus_id) {
    return NextResponse.json({ error: "Daily set not found" }, { status: 404 });
  }

  const [{ data: questions }, { data: submitted }, { data: bonusRow }] = await Promise.all([
    supabase
      .from("daily_challenges")
      .select("id, slot, prompt, answer_set_version")
      .eq("daily_set_id", session.daily_set_id)
      .order("slot", { ascending: true }),
    supabase
      .from("submitted_answers")
      .select(
        "id, challenge_id, raw_input, result, matched_answer_id, submitted_at_ms, score, tier, canonical_answer, explanation, references, is_daily_gem"
      )
      .eq("session_id", sessionId)
      .order("submitted_at_ms", { ascending: true }),
    supabase
      .from("scripture_bonus")
      .select("display_text, book, reference_display, translation, context_note")
      .eq("id", dailySet.scripture_bonus_id)
      .single(),
  ]);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Daily set has no questions" }, { status: 500 });
  }
  if (!bonusRow) {
    return NextResponse.json({ error: "Scripture Bonus not found" }, { status: 404 });
  }

  // Group submissions per question: prefer the accepted one; otherwise show
  // the player's last attempt (and how many guesses they took).
  const submissionsByChallenge = new Map<string, NonNullable<typeof submitted>>();
  for (const s of submitted ?? []) {
    const list = submissionsByChallenge.get(s.challenge_id) ?? [];
    list.push(s);
    submissionsByChallenge.set(s.challenge_id, list);
  }

  const questionResults: QuestionResult[] = [];

  for (const question of questions) {
    const attempts = submissionsByChallenge.get(question.id) ?? [];
    const accepted = attempts.find((a) => a.result === "accepted");
    // The literal last row can be an empty timeout skip even when the
    // player made several real guesses before time ran out — prefer their
    // last non-empty guess so "Last guess" (and the protest flow, which
    // reads off this same value) reflects what they actually typed.
    const lastRealAttempt = [...attempts].reverse().find((a) => a.raw_input.trim());
    const lastAttempt = lastRealAttempt ?? attempts[attempts.length - 1];
    const relevant = accepted ?? lastAttempt;
    const guessCount = attempts.filter((a) => a.raw_input.trim()).length;

    const { data: answerRows } = await supabase
      .from("challenge_answers")
      .select("id, canonical_answer, score, tier, references, explanation, is_catholic_only")
      .eq("challenge_id", question.id)
      .eq("answer_set_version", question.answer_set_version)
      .eq("active", true)
      .order("score", { ascending: false });

    // The scored outcome (score/tier/canonicalAnswer/etc.) is read from the
    // snapshot stored on the submission itself at answer time, not
    // re-derived from the current challenge_answers rows — that join can
    // silently break if this question's content is later edited/reversioned,
    // even though the score was already recorded correctly.
    questionResults.push({
      challengeId: question.id,
      slot: question.slot,
      prompt: question.prompt,
      guess: relevant?.raw_input ?? "",
      result: relevant?.result ?? "invalid",
      score: relevant?.score ?? 0,
      canonicalAnswer: relevant?.canonical_answer ?? undefined,
      tier: relevant?.tier ?? undefined,
      explanation: relevant?.explanation ?? undefined,
      references: relevant?.references ?? [],
      isDailyGem: relevant?.is_daily_gem ?? false,
      guessCount,
      attempts: attempts.filter((a) => a.raw_input.trim()).map((a) => ({ id: a.id, rawInput: a.raw_input })),
      allAnswers: (answerRows ?? []).map((a) => ({
        canonicalAnswer: a.canonical_answer,
        score: a.score,
        tier: a.tier,
        explanation: a.explanation,
        references: a.references ?? [],
        found: a.id === relevant?.matched_answer_id,
        isCatholicOnly: a.is_catholic_only,
      })),
    });
  }

  const results: SessionResults = {
    dayNumber: dailySet.day_number,
    totalScore: session.total_score,
    ascentScore: session.ascent_score,
    scriptureBonusMultiplier: session.scripture_bonus_multiplier,
    scriptureBonusLevel: session.scripture_bonus_level,
    scriptureBonusCorrect: session.scripture_bonus_correct,
    questionResults,
    scriptureBonus: {
      displayText: bonusRow.display_text,
      book: bonusRow.book,
      referenceDisplay: bonusRow.reference_display,
      translation: bonusRow.translation,
      contextNote: bonusRow.context_note,
    },
  };

  return NextResponse.json(results);
}
