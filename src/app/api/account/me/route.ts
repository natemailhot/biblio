import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ signedIn: false });
  }

  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();

  if (!profile) {
    return NextResponse.json({ signedIn: true, hasProfile: false });
  }

  return NextResponse.json({ signedIn: true, hasProfile: true, username: profile.username });
}
