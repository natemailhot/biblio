import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";
import { computeDayStreak } from "@/lib/content/streak";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const [{ data: sessions }, { data: today }] = await Promise.all([
    supabase
      .from("game_sessions")
      .select("total_score, scripture_bonus_multiplier, daily_set_id, daily_sets(day_number, date)")
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    supabase
      .from("daily_sets")
      .select("day_number")
      .eq("date", new Date().toLocaleDateString("en-CA"))
      .maybeSingle(),
  ]);

  // A day can have more than one completed session for the same account
  // (an anonymous play later linked, a replay from another device/browser
  // — nothing server-side blocks it, only the localStorage guard on the
  // same browser). Keep only the best score per day so stats reflect
  // "your best run each day," not inflated by duplicates.
  const bestByDay = new Map<number, { dayNumber: number; date: string; score: number; multiplier: number }>();
  for (const r of sessions ?? []) {
    const dailySet = r.daily_sets as unknown as { day_number: number; date: string } | null;
    if (!dailySet) continue;
    const existing = bestByDay.get(dailySet.day_number);
    if (!existing || r.total_score > existing.score) {
      bestByDay.set(dailySet.day_number, {
        dayNumber: dailySet.day_number,
        date: dailySet.date,
        score: r.total_score,
        multiplier: r.scripture_bonus_multiplier,
      });
    }
  }

  const history = [...bestByDay.values()].sort((a, b) => b.dayNumber - a.dayNumber);
  const played = history.length;

  if (played === 0) {
    return NextResponse.json({
      played: 0,
      dayStreak: 0,
      averageScore: 0,
      bestScore: 0,
      averageMultiplier: 0,
      history: [],
    });
  }

  const averageScore = Math.round(history.reduce((s, r) => s + r.score, 0) / played);
  const bestScore = Math.max(...history.map((r) => r.score));
  const averageMultiplier = Math.round((history.reduce((s, r) => s + r.multiplier, 0) / played) * 100) / 100;

  const dayStreak = computeDayStreak(
    history.map((h) => h.dayNumber),
    today?.day_number ?? null
  );

  return NextResponse.json({ played, dayStreak, averageScore, bestScore, averageMultiplier, history });
}
