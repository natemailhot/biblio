import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 2000;

// A simple suggestion box for future question ideas — saved for manual
// review later, same pattern as /api/feedback. Not a public queue.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = (body?.message as string | undefined)?.trim();
  const sessionId = body?.sessionId as string | undefined;

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "message is too long" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("question_submissions").insert({
    message,
    session_id: sessionId ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save submission" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
