import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Anon-key + cookies client for reading who's signed in, inside a Route
// Handler or Server Component. Only used to identify the current user
// (getClaims/getUser) — actual data access still goes through the
// service-role client, matching this app's existing pattern.
export async function createServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component that can't set cookies — the
          // proxy (middleware) already refreshes the session, so this is
          // safe to ignore here.
        }
      },
    },
  });
}

// Returns the signed-in user's id, or null if no one is signed in.
// Verifies the JWT signature (unlike getSession(), which just reads the
// cookie contents) — see Supabase's SSR auth guidance.
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createServerAuthClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}
