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
      "id, daily_set_id, ascent_score, scripture_bonus_score, scripture_bonus_correct, total_score, completed_at"
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
      .select("id, slot, prompt, answer_set_version, daily_gem_answer_id")
      .eq("daily_set_id", session.daily_set_id)
      .order("slot", { ascending: true }),
    supabase
      .from("submitted_answers")
      .select("challenge_id, raw_input, result, matched_answer_id")
      .eq("session_id", sessionId),
    supabase
      .from("scripture_bonus")
      .select("display_text, book, reference_display, translation, context_note, bonus_points")
      .eq("id", dailySet.scripture_bonus_id)
      .single(),
  ]);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Daily set has no questions" }, { status: 500 });
  }
  if (!bonusRow) {
    return NextResponse.json({ error: "Scripture Bonus not found" }, { status: 404 });
  }

  const submittedByChallenge = new Map((submitted ?? []).map((s) => [s.challenge_id, s]));

  const questionResults: QuestionResult[] = [];

  for (const question of questions) {
    const submission = submittedByChallenge.get(question.id);

    const { data: answerRows } = await supabase
      .from("challenge_answers")
      .select("id, canonical_answer, score, tier, references, explanation")
      .eq("challenge_id", question.id)
      .eq("answer_set_version", question.answer_set_version)
      .eq("active", true);

    const matched = submission?.matched_answer_id
      ? (answerRows ?? []).find((a) => a.id === submission.matched_answer_id)
      : undefined;

    const dailyGemRow = (answerRows ?? []).find((a) => a.id === question.daily_gem_answer_id);
    const bestMissedAnswer =
      !matched && dailyGemRow
        ? {
            canonicalAnswer: dailyGemRow.canonical_answer,
            score: dailyGemRow.score,
            tier: dailyGemRow.tier,
            explanation: dailyGemRow.explanation,
            references: dailyGemRow.references ?? [],
          }
        : null;

    questionResults.push({
      slot: question.slot,
      prompt: question.prompt,
      guess: submission?.raw_input ?? "",
      result: submission?.result ?? "invalid",
      score: matched?.score ?? 0,
      canonicalAnswer: matched?.canonical_answer,
      tier: matched?.tier,
      explanation: matched?.explanation,
      references: matched?.references ?? [],
      isDailyGem: matched ? matched.id === question.daily_gem_answer_id : false,
      bestMissedAnswer,
    });
  }

  const results: SessionResults = {
    dayNumber: dailySet.day_number,
    totalScore: session.total_score,
    ascentScore: session.ascent_score,
    scriptureBonusScore: session.scripture_bonus_score,
    scriptureBonusCorrect: session.scripture_bonus_correct,
    questionResults,
    scriptureBonus: {
      displayText: bonusRow.display_text,
      book: bonusRow.book,
      referenceDisplay: bonusRow.reference_display,
      translation: bonusRow.translation,
      contextNote: bonusRow.context_note,
      bonusPoints: bonusRow.bonus_points,
    },
  };

  return NextResponse.json(results);
}
