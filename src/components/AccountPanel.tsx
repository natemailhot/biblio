"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserClient";
import { fetchJson } from "@/lib/fetchJson";
import type { AccountMeResponse, PlayerStats } from "@/lib/types";

export function AccountPanel() {
  const [me, setMe] = useState<AccountMeResponse | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await fetchJson<AccountMeResponse>("/api/account/me");
      setMe(res);
      if (res.signedIn && res.hasProfile) {
        const s = await fetchJson<PlayerStats>("/api/stats");
        setStats(s);
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
  };

  const handleClaimUsername = async () => {
    if (!username.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetchJson("/api/account/username", { method: "POST", body: JSON.stringify({ username: username.trim() }) });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save username.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!me) return null;

  return (
    <div className="rounded-2xl border border-gold-soft bg-white/60 p-5">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">You</p>

      {!me.signedIn && (
        <>
          <p className="mt-2 text-sm text-stone-dark">
            An account keeps your finished puzzles on every device, puts you on the leaderboard,
            and shows you advanced stats.
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            className="mt-3 w-full rounded-full border-2 border-indigo px-6 py-3 font-medium text-indigo transition-colors hover:bg-indigo hover:text-parchment"
          >
            Continue with Google
          </button>
        </>
      )}

      {me.signedIn && !me.hasProfile && (
        <>
          <p className="mt-2 text-sm text-stone-dark">Choose a username to finish setting up your account.</p>
          <div className="mt-3 flex gap-2">
            <label htmlFor="account-username" className="sr-only">
              Username
            </label>
            <input
              id="account-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-20 letters, numbers, _"
              maxLength={20}
              className="min-h-[2.75rem] flex-1 rounded-xl border border-stone/40 bg-white px-3 text-ink focus:border-indigo"
            />
            <button
              type="button"
              onClick={handleClaimUsername}
              disabled={submitting || !username.trim()}
              className="rounded-xl bg-indigo px-4 font-medium text-parchment disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-indigo-dim">{error}</p>}
        </>
      )}

      {me.signedIn && me.hasProfile && (
        <>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-ink">
              Signed in as <span className="font-medium">{me.username}</span>
            </p>
            <button type="button" onClick={handleSignOut} className="text-sm text-stone-dark underline decoration-gold-soft underline-offset-4">
              Sign out
            </button>
          </div>
          <Link
            href="/stats"
            className="mt-1 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4"
          >
            See full stats →
          </Link>
          {stats && (
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="font-serif-heading text-xl font-semibold text-ink">{stats.played}</p>
                <p className="text-xs text-stone-dark">Played</p>
              </div>
              <div>
                <p className="font-serif-heading text-xl font-semibold text-ink">{stats.dayStreak}</p>
                <p className="text-xs text-stone-dark">Day streak</p>
              </div>
              <div>
                <p className="font-serif-heading text-xl font-semibold text-ink">×{stats.averageMultiplier.toFixed(2)}</p>
                <p className="text-xs text-stone-dark">Avg. bonus</p>
              </div>
              <div>
                <p className="font-serif-heading text-xl font-semibold text-ink">{stats.bestScore}</p>
                <p className="text-xs text-stone-dark">Best day</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
