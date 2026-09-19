import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { StartQuestionResponse } from "@/lib/types";

// Marks when a player was first shown a question, so the per-question
// timer can be enforced server-side on submission. Idempotent: calling
// twice just returns the original start time.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string; challengeId: string }> }
) {
  const { sessionId, challengeId } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("session_question_starts")
    .select("started_at")
    .eq("session_id", sessionId)
    .eq("challenge_id", challengeId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ startedAt: existing.started_at } satisfies StartQuestionResponse);
  }

  const { data: inserted, error } = await supabase
    .from("session_question_starts")
    .insert({ session_id: sessionId, challenge_id: challengeId })
    .select("started_at")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "Could not start question" }, { status: 500 });
  }

  return NextResponse.json({ startedAt: inserted.started_at } satisfies StartQuestionResponse);
}
