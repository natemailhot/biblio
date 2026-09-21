import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildBonusRoundStatus } from "@/lib/bonusRound";

// Locks the bonus round in, either because the player chose to reveal
// their results or because the 5-minute clock ran out client-side.
// Idempotent — calling it again after it's already completed just returns
// the same final score rather than recomputing it.
export async function POST(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
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

  const { data: bonusSession, error: bonusError } = await supabase
    .from("bonus_round_sessions")
    .select("id, completed_at")
    .eq("game_session_id", sessionId)
    .single();
  if (bonusError || !bonusSession) {
    return NextResponse.json({ error: "Bonus round not started" }, { status: 404 });
  }

  if (!bonusSession.completed_at) {
    const status = await buildBonusRoundStatus(supabase, sessionId, session.daily_set_id);
    await supabase
      .from("bonus_round_sessions")
      .update({ completed_at: new Date().toISOString(), final_score: status.currentScore })
      .eq("id", bonusSession.id);
  }

  const finalStatus = await buildBonusRoundStatus(supabase, sessionId, session.daily_set_id);
  return NextResponse.json(finalStatus);
}
