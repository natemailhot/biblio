import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";

const ANON_ID_COOKIE = "ascend_anon_id";
const ANON_ID_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

// Starts a game session for a published daily set (5 questions + bonus).
// Signed-in players are identified by user_id; anonymous players by a
// random first-party cookie (not fingerprinting) set here on first play.
// Either way, if that identity already has a *completed* session for this
// day, we hand back that session instead of creating a duplicate — the
// client (GameApp) treats `alreadyCompleted: true` the same as its
// existing "returning player" path and jumps straight to results.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const dailySetId = body?.dailySetId as string | undefined;

  if (!dailySetId) {
    return NextResponse.json({ error: "dailySetId is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const userId = await getAuthenticatedUserId();

  const cookieStore = await cookies();
  const existingAnonId = cookieStore.get(ANON_ID_COOKIE)?.value;
  const anonId = existingAnonId ?? crypto.randomUUID();

  const { data: dailySet, error: dailySetError } = await supabase
    .from("daily_sets")
    .select("id, status")
    .eq("id", dailySetId)
    .single();

  if (dailySetError || !dailySet) {
    return NextResponse.json({ error: "Daily set not found" }, { status: 404 });
  }

  let priorQuery = supabase
    .from("game_sessions")
    .select("id, started_at")
    .eq("daily_set_id", dailySet.id)
    .not("completed_at", "is", null);
  priorQuery = userId ? priorQuery.eq("user_id", userId) : priorQuery.eq("anon_id", anonId);

  const { data: prior } = await priorQuery.maybeSingle();

  const response = prior
    ? NextResponse.json({ sessionId: prior.id, startedAt: prior.started_at, alreadyCompleted: true })
    : await (async () => {
        const { data: session, error: sessionError } = await supabase
          .from("game_sessions")
          .insert({ daily_set_id: dailySet.id, mode: "timed", user_id: userId, anon_id: anonId })
          .select("id, started_at")
          .single();

        if (sessionError || !session) {
          return NextResponse.json({ error: "Could not start session" }, { status: 500 });
        }
        return NextResponse.json({ sessionId: session.id, startedAt: session.started_at, alreadyCompleted: false });
      })();

  if (!existingAnonId) {
    response.cookies.set(ANON_ID_COOKIE, anonId, {
      maxAge: ANON_ID_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
