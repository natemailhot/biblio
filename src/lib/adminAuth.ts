import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/serverAuth";

// The only "approval" mechanism for admin access: a comma-separated
// allowlist of Google account emails set in the environment (ADMIN_EMAILS),
// matching how this app already keeps privileged config out of the
// database rather than adding an admin table for a single flag.
function adminEmailAllowlist(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

// Returns the signed-in user's id if their account's email is on the
// ADMIN_EMAILS allowlist, otherwise null (whether signed out, signed in as
// a non-admin, or the allowlist is empty/unset).
export async function getAdminUserId(): Promise<string | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const allowlist = adminEmailAllowlist();
  if (allowlist.size === 0) return null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email || !allowlist.has(email)) return null;

  return userId;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await getAdminUserId()) !== null;
}
