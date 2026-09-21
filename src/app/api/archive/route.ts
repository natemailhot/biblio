import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Public — lists every published day up to and including today, for the
// archive page and the "X of N played" stat. Never reveals a future day
// (even if it's already seeded/published-scheduled ahead of time).
export async function GET() {
  const supabase = createServiceRoleClient();
  const today = new Date().toLocaleDateString("en-CA");

  const { data, error } = await supabase
    .from("daily_sets")
    .select("id, day_number, date")
    .eq("status", "published")
    .lte("date", today)
    .order("day_number", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load archive" }, { status: 500 });
  }

  return NextResponse.json({
    days: (data ?? []).map((d) => ({ dailySetId: d.id, dayNumber: d.day_number, date: d.date })),
  });
}
