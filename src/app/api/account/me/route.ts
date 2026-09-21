import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";
import { isCurrentUserAdmin } from "@/lib/adminAuth";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ signedIn: false });
  }

  const supabase = createServiceRoleClient();
  const [{ data: profile }, isAdmin] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    isCurrentUserAdmin(),
  ]);

  if (!profile) {
    return NextResponse.json({ signedIn: true, hasProfile: false, isAdmin });
  }

  return NextResponse.json({ signedIn: true, hasProfile: true, username: profile.username, isAdmin });
}
