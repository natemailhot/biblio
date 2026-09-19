import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { DailySetSummary } from "@/lib/types";

// Public-safe entry point for the landing screen: the day's 5 question
// prompts and the bonus verse text, but never any answer set or the
// bonus's correct book.
export async function GET() {
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);

  let { data: dailySet } = await supabase
    .from("daily_sets")
    .select("id, date, day_number, scripture_bonus_id, status")
    .eq("status", "published")
    .lte("date", today)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dailySet) {
    const fallback = await supabase
      .from("daily_sets")
      .select("id, date, day_number, scripture_bonus_id, status")
      .eq("status", "published")
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();
    dailySet = fallback.data;
  }

  if (!dailySet || !dailySet.scripture_bonus_id) {
    return NextResponse.json({ error: "No published daily set available" }, { status: 404 });
  }

  const [{ data: bonus }, { data: questions }] = await Promise.all([
    supabase
      .from("scripture_bonus")
      .select("id, display_text, canon_scope")
      .eq("id", dailySet.scripture_bonus_id)
      .single(),
    supabase
      .from("daily_challenges")
      .select("id, slot, prompt, instructions, what_counts, duration_seconds")
      .eq("daily_set_id", dailySet.id)
      .order("slot", { ascending: true }),
  ]);

  if (!bonus) {
    return NextResponse.json({ error: "Daily set is missing its Scripture Bonus" }, { status: 500 });
  }
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Daily set has no questions" }, { status: 500 });
  }

  const summary: DailySetSummary = {
    id: dailySet.id,
    dayNumber: dailySet.day_number,
    date: dailySet.date,
    questions: questions.map((q) => ({
      id: q.id,
      slot: q.slot,
      prompt: q.prompt,
      instructions: q.instructions,
      whatCounts: q.what_counts,
      durationSeconds: q.duration_seconds,
    })),
    scriptureBonus: {
      id: bonus.id,
      displayText: bonus.display_text,
      canonScope: bonus.canon_scope,
    },
  };

  return NextResponse.json(summary);
}
