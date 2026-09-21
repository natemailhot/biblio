import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";
import { isCurrentUserAdmin } from "@/lib/adminAuth";
import { deriveAvailableUsername } from "@/lib/username";

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

  if (profile) {
    return NextResponse.json({ signedIn: true, hasProfile: true, username: profile.username, isAdmin });
  }

  // First time we've seen this signed-in identity — default their
  // username to their email's local part (their "gmail alias") instead of
  // making them pick one before they show up on the leaderboard. They can
  // still rename any time via POST /api/account/username.
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) {
    return NextResponse.json({ signedIn: true, hasProfile: false, isAdmin });
  }

  const username = await deriveAvailableUsername(supabase, email);
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ id: userId, username })
    .select("username")
    .single();

  if (error || !created) {
    // Non-fatal — e.g. a race with a concurrent request already creating
    // the same profile. Fall through to the manual claim flow rather than
    // erroring the whole account check.
    return NextResponse.json({ signedIn: true, hasProfile: false, isAdmin });
  }

  return NextResponse.json({ signedIn: true, hasProfile: true, username: created.username, isAdmin });
}
