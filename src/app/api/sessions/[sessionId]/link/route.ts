import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";

// Attaches the signed-in user to a session that was played anonymously
// before they signed in (or signed in mid-session). Called from the
// results screen every time it's shown — a no-op if the session is
// already linked to someone, so it's safe to call repeatedly. The client
// supplies the sessionId from its own localStorage record, which is the
// only reliable way to know "this browser's session," rather than
// guessing from timing.
export async function POST(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("game_sessions").update({ user_id: userId }).eq("id", sessionId).is("user_id", null);

  if (error) {
    return NextResponse.json({ error: "Could not link session" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
