import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUserId } from "@/lib/adminAuth";
import { buildDailySetSummary } from "@/lib/dailySet";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Admin-only equivalent of /api/daily-set: looks a day up by its exact
// date regardless of status (draft/scheduled/published), so an approved
// admin can preview-play a day before it's live. Still returns the same
// public-safe DailySetSummary shape — no answer set here either, this is
// what GameApp uses to actually play it.
export async function GET(req: NextRequest) {
  const adminUserId = await getAdminUserId();
  if (!adminUserId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date || !DATE_PATTERN.test(date)) {
    return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: dailySet } = await supabase
    .from("daily_sets")
    .select("id, date, day_number, scripture_bonus_id")
    .eq("date", date)
    .maybeSingle();

  if (!dailySet) {
    return NextResponse.json({ error: "No daily set for that date" }, { status: 404 });
  }

  const summary = await buildDailySetSummary(supabase, dailySet);
  if (!summary) {
    return NextResponse.json({ error: "Daily set is missing its Scripture Bonus or questions" }, { status: 500 });
  }

  return NextResponse.json(summary);
}
