import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const [{ data: sessions }, { data: today }] = await Promise.all([
    supabase
      .from("game_sessions")
      .select("total_score, scripture_bonus_multiplier, daily_set_id, daily_sets(day_number)")
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    supabase
      .from("daily_sets")
      .select("day_number")
      .eq("date", new Date().toLocaleDateString("en-CA"))
      .maybeSingle(),
  ]);

  const rows = sessions ?? [];
  const played = rows.length;

  if (played === 0) {
    return NextResponse.json({
      played: 0,
      dayStreak: 0,
      averageScore: 0,
      bestScore: 0,
      averageMultiplier: 0,
    });
  }

  const averageScore = Math.round(rows.reduce((s, r) => s + r.total_score, 0) / played);
  const bestScore = Math.max(...rows.map((r) => r.total_score));
  const averageMultiplier =
    Math.round((rows.reduce((s, r) => s + r.scripture_bonus_multiplier, 0) / played) * 100) / 100;

  // Day streak: consecutive daily_set day_numbers played, walking backward
  // from the most recent one — only "live" if the most recent play was
  // today or yesterday (relative to the player's local date, same
  // day-rollover convention the rest of the app uses).
  const dayNumbers = [
    ...new Set(
      rows
        .map((r) => (r.daily_sets as unknown as { day_number: number } | null)?.day_number)
        .filter((n): n is number => typeof n === "number")
    ),
  ].sort((a, b) => b - a);

  let dayStreak = 0;
  if (dayNumbers.length > 0 && today?.day_number != null) {
    const mostRecent = dayNumbers[0];
    if (mostRecent === today.day_number || mostRecent === today.day_number - 1) {
      dayStreak = 1;
      for (let i = 1; i < dayNumbers.length; i++) {
        if (dayNumbers[i] === dayNumbers[i - 1] - 1) dayStreak++;
        else break;
      }
    }
  }

  return NextResponse.json({ played, dayStreak, averageScore, bestScore, averageMultiplier });
}
