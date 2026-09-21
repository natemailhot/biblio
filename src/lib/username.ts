import type { createServiceRoleClient } from "@/lib/supabase/server";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// Turns an email's local part ("nate.mailhot+ascend@gmail.com" ->
// "natemailhot") into something that satisfies the username format
// constraint (3-20 chars, letters/numbers/underscore only) — drops any
// "+tag" Gmail-style suffix, strips everything else disallowed, and pads
// out short results so very short local parts still clear the 3-char floor.
function sanitizeToUsernameBase(localPart: string): string {
  const withoutPlusTag = localPart.split("+")[0];
  const stripped = withoutPlusTag.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  if (stripped.length >= 3) return stripped;
  return (stripped + "user").slice(0, 20).padEnd(3, "0");
}

// Finds a default username for a newly signed-in player, derived from
// their email's local part, that isn't already taken (case-insensitively)
// — appends a numeric suffix and retries if it collides, same as asking a
// human to pick another name.
export async function deriveAvailableUsername(
  supabase: ReturnType<typeof createServiceRoleClient>,
  email: string
): Promise<string> {
  const localPart = email.split("@")[0] ?? "player";
  const base = sanitizeToUsernameBase(localPart) || "player";

  for (let attempt = 0; attempt < 25; attempt++) {
    const suffix = attempt === 0 ? "" : String(attempt + 1);
    const candidate = (suffix ? base.slice(0, 20 - suffix.length) + suffix : base).slice(0, 20);
    if (!USERNAME_RE.test(candidate)) continue;

    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", candidate)
      .maybeSingle();
    if (!taken) return candidate;
  }

  // Extremely unlikely fallback: every short suffix taken — use part of a
  // random id to guarantee something valid and available.
  return `player${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}
