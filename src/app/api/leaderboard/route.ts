import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bucketScores } from "@/lib/content/scoreBuckets";
import { deriveAnonUsername } from "@/lib/anonName";

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

  // Ranked list: signed-in players show under their chosen username;
  // never-signed-in players still show, under a name deterministically
  // derived from their device (see deriveAnonUsername) rather than being
  // left off the board entirely.
  //
  // Score is the SUM of each identity's best score per distinct day in
  // range (not a single best day) — a "today" range only ever has one
  // qualifying day, so this naturally degenerates to that day's score
  // there; for "week"/"all" it rewards playing consistently well over the
  // window instead of one lucky day beating a run of solid ones. The
  // multiplier column is the average across those same days.
  const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter((id): id is string => !!id))];
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  type DayBest = { score: number; multiplier: number };
  const bestByUserDay = new Map<string, Map<number, DayBest>>();
  const bestByAnonDay = new Map<string, Map<number, DayBest>>();

  const recordDayBest = (map: Map<string, Map<number, DayBest>>, identity: string, dayNumber: number, r: (typeof rows)[number]) => {
    const perDay = map.get(identity) ?? new Map<number, DayBest>();
    const existing = perDay.get(dayNumber);
    if (!existing || r.total_score > existing.score) {
      perDay.set(dayNumber, { score: r.total_score, multiplier: r.scripture_bonus_multiplier });
    }
    map.set(identity, perDay);
  };

  for (const r of rows ?? []) {
    const dailySet = r.daily_sets as unknown as { day_number: number } | null;
    if (!dailySet) continue;
    if (r.user_id) {
      recordDayBest(bestByUserDay, r.user_id, dailySet.day_number, r);
    } else if (r.anon_id) {
      // A row can carry an anon_id even after being linked to an account
      // (it's the cookie the session started under) — only rows with no
      // user_id at all represent a real guest identity.
      recordDayBest(bestByAnonDay, r.anon_id, dailySet.day_number, r);
    }
  }

  const summarize = (perDay: Map<number, DayBest>) => {
    const days = [...perDay.values()];
    const score = days.reduce((sum, d) => sum + d.score, 0);
    const multiplier = Math.round((days.reduce((sum, d) => sum + d.multiplier, 0) / days.length) * 100) / 100;
    return { score, multiplier };
  };

  const userEntries = [...bestByUserDay.entries()]
    .map(([userId, perDay]) => ({
      username: usernameById.get(userId) ?? null,
      ...summarize(perDay),
      guest: false,
    }))
    .filter((e): e is { username: string; score: number; multiplier: number; guest: boolean } => e.username !== null);

  const anonEntries = [...bestByAnonDay.entries()].map(([anonId, perDay]) => ({
    username: deriveAnonUsername(anonId),
    ...summarize(perDay),
    guest: true,
  }));

  const entries = [...userEntries, ...anonEntries].sort((a, b) => b.score - a.score).slice(0, LIMIT);

  return NextResponse.json({ range, entries, histogram });
}
