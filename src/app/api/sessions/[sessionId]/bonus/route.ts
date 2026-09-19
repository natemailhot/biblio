import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAnswer } from "@/lib/answers/normalize";
import type { SubmitBonusResponse } from "@/lib/types";

// Scores the Scripture Bonus book guess and reveals the answer. Runs
// independently of the Ascent timer/duration checks — the spec calls for
// this to feel separate enough that missing it doesn't sour an otherwise
// good round.
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
    .select("id, daily_set_id, total_score, scripture_bonus_answer")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.scripture_bonus_answer !== null) {
    return NextResponse.json({ error: "Scripture Bonus already answered" }, { status: 409 });
  }

  const { data: dailySet, error: dailySetError } = await supabase
    .from("daily_sets")
    .select("scripture_bonus_id")
    .eq("id", session.daily_set_id)
    .single();

  if (dailySetError || !dailySet?.scripture_bonus_id) {
    return NextResponse.json({ error: "Daily set has no Scripture Bonus" }, { status: 404 });
  }

  const { data: bonus, error: bonusError } = await supabase
    .from("scripture_bonus")
    .select(
      "book, reference_display, translation, context_note, accepted_book_aliases, bonus_points"
    )
    .eq("id", dailySet.scripture_bonus_id)
    .single();

  if (bonusError || !bonus) {
    return NextResponse.json({ error: "Scripture Bonus not found" }, { status: 404 });
  }

  const normalizedInput = normalizeAnswer(rawInput);
  const acceptedNormalized = [bonus.book, ...(bonus.accepted_book_aliases ?? [])].map(normalizeAnswer);
  const correct = acceptedNormalized.includes(normalizedInput);
  const awardedScore = correct ? bonus.bonus_points : 0;

  await supabase
    .from("game_sessions")
    .update({
      scripture_bonus_answer: rawInput,
      scripture_bonus_correct: correct,
      scripture_bonus_score: awardedScore,
      total_score: session.total_score + awardedScore,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  const response: SubmitBonusResponse = {
    correct,
    score: awardedScore,
    book: bonus.book,
    referenceDisplay: bonus.reference_display,
    translation: bonus.translation,
    contextNote: bonus.context_note,
  };

  return NextResponse.json(response);
}
