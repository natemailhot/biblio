import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildBonusRoundStatus, BONUS_ROUND_DURATION_MS } from "@/lib/bonusRound";

// Starts the optional 5-minute bonus round: a second chance at the same 5
// questions, starting from whatever the player already answered correctly
// in the main round. Idempotent — if it's already been started (e.g. a
// page refresh mid-round), this just returns the current status instead
// of resetting the clock.
export async function POST(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = createServiceRoleClient();

  const { data: session, error } = await supabase
    .from("game_sessions")
    .select("id, daily_set_id, completed_at, ascent_score, user_id, anon_id")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (!session.completed_at) {
    return NextResponse.json({ error: "Finish today's Ascend and Scripture Bonus first" }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("bonus_round_sessions")
    .select("id")
    .eq("game_session_id", sessionId)
    .maybeSingle();

  if (!existing) {
    const now = new Date();
    const endsAt = new Date(now.getTime() + BONUS_ROUND_DURATION_MS);
    const { error: insertError } = await supabase.from("bonus_round_sessions").insert({
      game_session_id: sessionId,
      daily_set_id: session.daily_set_id,
      user_id: session.user_id,
      anon_id: session.anon_id,
      baseline_score: session.ascent_score,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    });
    if (insertError) {
      return NextResponse.json({ error: "Could not start the bonus round" }, { status: 500 });
    }
  }

  const status = await buildBonusRoundStatus(supabase, sessionId, session.daily_set_id);
  return NextResponse.json(status);
}
