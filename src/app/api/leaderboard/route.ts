import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bucketScores } from "@/lib/content/scoreBuckets";

const LIMIT = 50;

// The ranked list only shows signed-in players (a row needs a username to
// display). The score-distribution histogram is different: it should
// reflect everyone who played, signed in or not, so it's not filtered by
// user_id — an anonymous player's score is still a real score.
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
    .select("user_id, anon_id, total_score, scripture_bonus_multiplier, daily_set_id, daily_sets!inner(day_number)")
    .eq("is_admin_preview", false)
    .not("completed_at", "is", null)
    .order("total_score", { ascending: false })
    // Fetched well above LIMIT because an identity can have more than one
    // completed session across a multi-day window (that's expected — one
    // per day) and, historically, more than one for the same day (an
    // anonymous play later linked to an account, another device); dedupe
    // per identity per day below, then take the top LIMIT of that.
    .limit(LIMIT * 20);

  if (range === "today" && today?.day_number != null) {
    query = query.eq("daily_sets.day_number", today.day_number);
  } else if (range === "week" && today?.day_number != null) {
    query = query.gte("daily_sets.day_number", today.day_number - 6);
  }

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Could not load leaderboard" }, { status: 500 });
  }

  // Histogram: every completed session counts, signed in or not. Dedupe by
  // identity (user_id, else anon_id, else the row itself) so a single
  // player's best score for the window is counted once, not once per
  // session.
  const bestByIdentity = new Map<string, number>();
  for (const r of rows ?? []) {
    const dailySet = r.daily_sets as unknown as { day_number: number } | null;
    const identity = r.user_id ?? (r.anon_id ? `anon:${r.anon_id}:${dailySet?.day_number ?? "all"}` : `session:${Math.random()}`);
    const existing = bestByIdentity.get(identity);
    if (existing === undefined || r.total_score > existing) {
      bestByIdentity.set(identity, r.total_score);
    }
  }
  const histogram = bucketScores([...bestByIdentity.values()]);

  // Ranked list: signed-in only.
  const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter((id): id is string => !!id))];
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  const bestByUser = new Map<string, { score: number; multiplier: number }>();
  for (const r of rows ?? []) {
    if (!r.user_id) continue;
    const existing = bestByUser.get(r.user_id);
    if (!existing || r.total_score > existing.score) {
      bestByUser.set(r.user_id, { score: r.total_score, multiplier: r.scripture_bonus_multiplier });
    }
  }

  const entries = [...bestByUser.entries()]
    .map(([userId, best]) => ({
      username: usernameById.get(userId) ?? null,
      score: best.score,
      multiplier: best.multiplier,
    }))
    .filter((e): e is { username: string; score: number; multiplier: number } => e.username !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT);

  return NextResponse.json({ range, entries, histogram });
}
