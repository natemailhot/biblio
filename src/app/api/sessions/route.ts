import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Starts a game session for a published daily set (5 questions + bonus).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const dailySetId = body?.dailySetId as string | undefined;

  if (!dailySetId) {
    return NextResponse.json({ error: "dailySetId is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: dailySet, error: dailySetError } = await supabase
    .from("daily_sets")
    .select("id, status")
    .eq("id", dailySetId)
    .single();

  if (dailySetError || !dailySet) {
    return NextResponse.json({ error: "Daily set not found" }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({ daily_set_id: dailySet.id, mode: "timed" })
    .select("id, started_at")
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Could not start session" }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id, startedAt: session.started_at });
}
