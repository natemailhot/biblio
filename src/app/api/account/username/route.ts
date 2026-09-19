import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// Sets the display name for the signed-in user's profile — creates the
// profile row on first call (post-OAuth onboarding), or renames it on
// later calls.
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const username = (body?.username as string | undefined)?.trim();

  if (!username || !USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters: letters, numbers, and underscores only." },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("profiles").upsert({ id: userId, username }, { onConflict: "id" });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save username." }, { status: 500 });
  }

  return NextResponse.json({ username });
}
