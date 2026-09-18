import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Starts a game session for a published daily challenge. Returns only the
// public-safe challenge metadata — never the answer set.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const challengeId = body?.challengeId as string | undefined;
  const mode = (body?.mode as string | undefined) === "accessibility" ? "accessibility" : "timed";

  if (!challengeId) {
    return NextResponse.json({ error: "challengeId is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("daily_challenges")
    .select("id, prompt, instructions, what_counts, duration_seconds, answer_set_version, status")
    .eq("id", challengeId)
    .single();

  if (challengeError || !challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      challenge_id: challenge.id,
      mode,
      answer_set_version: challenge.answer_set_version,
    })
    .select("id, started_at")
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Could not start session" }, { status: 500 });
  }

  return NextResponse.json({
    sessionId: session.id,
    startedAt: session.started_at,
    challenge: {
      id: challenge.id,
      prompt: challenge.prompt,
      instructions: challenge.instructions,
      whatCounts: challenge.what_counts,
      durationSeconds: challenge.duration_seconds,
      mode,
    },
  });
}
