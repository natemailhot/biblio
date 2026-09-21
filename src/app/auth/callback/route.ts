import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Google redirects here after sign-in with a one-time `code`; we exchange
// it for a session (setting the auth cookies) and send the player back to
// the game. Any failure — an upstream error from Google/Supabase, or the
// code exchange itself failing (e.g. a missing PKCE code_verifier cookie,
// which some mobile browsers drop across the multi-hop OAuth redirect) —
// is surfaced via an `authError` query param instead of silently landing
// back on a signed-out home page with no explanation.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const upstreamError =
    request.nextUrl.searchParams.get("error_description") ?? request.nextUrl.searchParams.get("error");
  const origin = request.nextUrl.origin;

  if (upstreamError) {
    console.error("[auth/callback] upstream error:", upstreamError);
    return NextResponse.redirect(`${origin}/?authError=${encodeURIComponent(upstreamError)}`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
      return NextResponse.redirect(`${origin}/?authError=${encodeURIComponent(error.message)}`);
    }
  } else {
    console.error("[auth/callback] no code param present");
    return NextResponse.redirect(`${origin}/?authError=${encodeURIComponent("No authorization code received")}`);
  }

  return NextResponse.redirect(`${origin}/`);
}
