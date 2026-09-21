import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildBonusRoundStatus } from "@/lib/bonusRound";

// Read-only status check — used to resume an in-progress bonus round after
// a page refresh, and to show the final score on the results screen once
// it's done. Never creates anything (see the start route for that).
export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = createServiceRoleClient();

  const { data: session, error } = await supabase
    .from("game_sessions")
    .select("id, daily_set_id")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const status = await buildBonusRoundStatus(supabase, sessionId, session.daily_set_id);
  return NextResponse.json(status);
}
