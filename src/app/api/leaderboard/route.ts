import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const LIMIT = 50;

// Public — no auth required to view (only to appear on it, since a row
// only exists here if the session that earned it had a signed-in user_id).
export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range") ?? "today";
  if (!["today", "week", "all"].includes(range)) {
    return NextResponse.json({ error: "range must be today, week, or all" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: today } = await supabase
    .from("daily_sets")
    .select("day_number")
    .eq("date", new Date().toLocaleDateString("en-CA"))
    .maybeSingle();

  let query = supabase
    .from("game_sessions")
    .select("user_id, total_score, scripture_bonus_multiplier, daily_set_id, daily_sets!inner(day_number)")
    .not("completed_at", "is", null)
    .not("user_id", "is", null)
    .order("total_score", { ascending: false })
    .limit(LIMIT);

  if (range === "today" && today?.day_number != null) {
    query = query.eq("daily_sets.day_number", today.day_number);
  } else if (range === "week" && today?.day_number != null) {
    query = query.gte("daily_sets.day_number", today.day_number - 6);
  }

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Could not load leaderboard" }, { status: 500 });
  }

  const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter((id): id is string => !!id))];
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  const entries = (rows ?? [])
    .map((r) => ({
      username: usernameById.get(r.user_id!) ?? null,
      score: r.total_score,
      multiplier: r.scripture_bonus_multiplier,
    }))
    .filter((e) => e.username !== null);

  return NextResponse.json({ range, entries });
}
