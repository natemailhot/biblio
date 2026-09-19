import { createBrowserClient } from "@supabase/ssr";

// Anon-key client for the browser: only used for Supabase Auth (sign-in,
// sign-out, session state). Never used to query tables directly — every
// data read/write goes through a Next.js API route using the service-role
// client, same as the rest of this app.
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
