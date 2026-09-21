import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildDailySetSummary } from "@/lib/dailySet";

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

  if (!dailySet) {
    return NextResponse.json({ error: "No published daily set available" }, { status: 404 });
  }

  const summary = await buildDailySetSummary(supabase, dailySet);
  if (!summary) {
    return NextResponse.json({ error: "Daily set is missing its Scripture Bonus or questions" }, { status: 500 });
  }

  return NextResponse.json(summary);
}
