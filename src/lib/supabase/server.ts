import { createClient } from "@supabase/supabase-js";
import ws from "ws";

// Server-only client using the service role key. Never import this from
// client components — it bypasses RLS and must stay on the server, which is
// what keeps the unrevealed answer set out of the browser.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Node 20 lacks a global WebSocket; supabase-js's realtime client
    // (unused here, but constructed eagerly) needs an explicit transport.
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
}
