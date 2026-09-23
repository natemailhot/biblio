import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";

const ANON_ID_COOKIE = "ascend_anon_id";

// Read-only check: has this identity (signed-in account, or this device's
// anon cookie) already completed the given day? Used to skip straight to
// results on load instead of making the player click "Begin" first to
// find out — unlike POST /api/sessions, this never creates anything.
export async function GET(req: NextRequest) {
  const dailySetId = req.nextUrl.searchParams.get("dailySetId");
  if (!dailySetId) {
    return NextResponse.json({ error: "dailySetId is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const userId = await getAuthenticatedUserId();
  const cookieStore = await cookies();
  const anonId = cookieStore.get(ANON_ID_COOKIE)?.value;

  if (!userId && !anonId) {
    return NextResponse.json({ sessionId: null });
  }

  let query = supabase
    .from("game_sessions")
    .select("id")
    .eq("daily_set_id", dailySetId)
    .eq("is_admin_preview", false)
    .not("completed_at", "is", null);
  query = userId ? query.eq("user_id", userId) : query.eq("anon_id", anonId!);

  const { data } = await query.maybeSingle();
  return NextResponse.json({ sessionId: data?.id ?? null });
}
