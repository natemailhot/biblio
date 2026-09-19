import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 2000;

// "Report a missing answer or issue" writes here instead of opening a
// mailto link, so it can be reviewed later (e.g. via the Supabase
// dashboard) without needing an inbox set up.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = (body?.message as string | undefined)?.trim();
  const sessionId = body?.sessionId as string | undefined;
  const dailySetId = body?.dailySetId as string | undefined;

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "message is too long" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("feedback_reports").insert({
    message,
    session_id: sessionId ?? null,
    daily_set_id: dailySetId ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
