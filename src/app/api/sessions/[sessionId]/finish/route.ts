import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Marks the Ascent portion of a session as finished — either the player hit
// "Finish" or the client timer ran out. Idempotent: finishing twice is a
// no-op rather than an error, since the client may call this defensively.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = createServiceRoleClient();

  const { data: session, error } = await supabase
    .from("game_sessions")
    .select("id, completed_at")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.completed_at) {
    await supabase
      .from("game_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", sessionId);
  }

  return NextResponse.json({ ok: true });
}
