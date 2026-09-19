import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { DailySetSummary } from "@/lib/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Public-safe entry point for the landing screen: the day's 5 question
// prompts and the bonus verse text, but never any answer set or the
// bonus's correct book.
export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient();

  // The day rolls over at midnight in each player's own local time, not a
  // single canonical server time — the client sends its local calendar
  // date; fall back to the server's UTC date if it's missing or malformed
  // (e.g. a direct API call without the query param).
  const clientDate = req.nextUrl.searchParams.get("date");
  const today = clientDate && DATE_PATTERN.test(clientDate) ? clientDate : new Date().toISOString().slice(0, 10);

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
