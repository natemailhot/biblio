"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserClient";
import { fetchJson } from "@/lib/fetchJson";
import { AccountPanel } from "./AccountPanel";
import type { AccountMeResponse, PlayerStats } from "@/lib/types";

// Fixed circular trigger in the top-right corner, persistent across every
// screen (rendered once from the root layout). Opens a popover with sign
// in / username setup / mini stats — see AccountPanel for the content.
export function AccountButton() {
  const [me, setMe] = useState<AccountMeResponse | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    try {
      const res = await fetchJson<AccountMeResponse>("/api/account/me");
      setMe(res);
      if (res.signedIn && res.hasProfile) {
        setStats(await fetchJson<PlayerStats>("/api/stats"));
      } else {
        setStats(null);
      }
    } catch {
      setMe({ signedIn: false });
    }
  };

  useEffect(() => {
    fetchJson<AccountMeResponse>("/api/account/me")
      .then(async (res) => {
        setMe(res);
        if (res.signedIn && res.hasProfile) {
          setStats(await fetchJson<PlayerStats>("/api/stats"));
        }
      })
      .catch(() => setMe({ signedIn: false }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSignIn = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setMe({ signedIn: false });
    setStats(null);
    setOpen(false);
  };

  const handleClaimUsername = async () => {
    if (!username.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetchJson("/api/account/username", { method: "POST", body: JSON.stringify({ username: username.trim() }) });
      setUsername("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save username.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!me) return null;

  const initial = me.signedIn && me.hasProfile ? me.username.charAt(0).toUpperCase() : null;

  return (
    <div ref={containerRef} className="fixed top-4 right-4 z-20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account"
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gold-soft bg-white/90 text-lg font-semibold text-indigo shadow-md transition-colors hover:border-indigo"
      >
        {initial ?? "👤"}
      </button>

      {open && (
        <div className="animate-rise-in absolute top-14 right-0 w-80 max-w-[calc(100vw-2rem)]">
          <AccountPanel
            me={me}
            stats={stats}
            username={username}
            onUsernameChange={setUsername}
            submitting={submitting}
            error={error}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onClaimUsername={handleClaimUsername}
          />
        </div>
      )}
    </div>
  );
}
