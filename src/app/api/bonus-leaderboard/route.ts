import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bucketScores, BONUS_SCORE_BUCKETS } from "@/lib/content/scoreBuckets";
import { deriveAnonUsername } from "@/lib/anonName";

const LIMIT = 50;

// Same shape/approach as /api/leaderboard, sourced from bonus_round_sessions
// instead of game_sessions — the bonus round has its own score, and it's
// entirely optional, so only players who actually played one show up here
// at all (no zero-score entries for skipping it).
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
    .from("bonus_round_sessions")
    .select("user_id, anon_id, final_score, daily_set_id, daily_sets!inner(day_number)")
    .not("completed_at", "is", null)
    .order("final_score", { ascending: false })
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

  const bestByIdentity = new Map<string, number>();
  for (const r of rows ?? []) {
    const dailySet = r.daily_sets as unknown as { day_number: number } | null;
    const identity =
      r.user_id ?? (r.anon_id ? `anon:${r.anon_id}:${dailySet?.day_number ?? "all"}` : `session:${Math.random()}`);
    const score = r.final_score ?? 0;
    const existing = bestByIdentity.get(identity);
    if (existing === undefined || score > existing) {
      bestByIdentity.set(identity, score);
    }
  }
  const histogram = bucketScores([...bestByIdentity.values()], BONUS_SCORE_BUCKETS);

  const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter((id): id is string => !!id))];
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  const bestByUser = new Map<string, number>();
  const bestByAnon = new Map<string, number>();
  for (const r of rows ?? []) {
    const score = r.final_score ?? 0;
    if (r.user_id) {
      const existing = bestByUser.get(r.user_id);
      if (existing === undefined || score > existing) bestByUser.set(r.user_id, score);
    } else if (r.anon_id) {
      const existing = bestByAnon.get(r.anon_id);
      if (existing === undefined || score > existing) bestByAnon.set(r.anon_id, score);
    }
  }

  const userEntries = [...bestByUser.entries()]
    .map(([userId, score]) => ({ username: usernameById.get(userId) ?? null, score, guest: false }))
    .filter((e): e is { username: string; score: number; guest: boolean } => e.username !== null);

  const anonEntries = [...bestByAnon.entries()].map(([anonId, score]) => ({
    username: deriveAnonUsername(anonId),
    score,
    guest: true,
  }));

  const entries = [...userEntries, ...anonEntries].sort((a, b) => b.score - a.score).slice(0, LIMIT);

  return NextResponse.json({ range, entries, histogram });
}
