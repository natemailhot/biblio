"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { fetchJson } from "@/lib/fetchJson";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserClient";
import { ScoreHistogram } from "@/components/ScoreHistogram";
import type { AccountMeResponse, LeaderboardRange, LeaderboardResponse } from "@/lib/types";

const RANGE_NOUN: Record<LeaderboardRange, string> = {
  today: "today's",
  week: "this week's",
  all: "all-time",
};

const RANGES: { key: LeaderboardRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 days" },
  { key: "all", label: "All time" },
];

export default function LeaderboardPage() {
  const [range, setRange] = useState<LeaderboardRange>("today");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [me, setMe] = useState<AccountMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<AccountMeResponse>("/api/account/me")
      .then(setMe)
      .catch(() => setMe({ signedIn: false }));
  }, []);

  useEffect(() => {
    fetchJson<LeaderboardResponse>(`/api/leaderboard?range=${range}`)
      .then((res) => {
        setError(null);
        setData(res);
      })
      .catch(() => setError("Could not load the leaderboard."));
  }, [range]);

  const handleSignIn = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Leaderboard
      </p>
      <div>
        <h1 className="font-serif-heading text-3xl font-semibold text-ink">Leaderboard</h1>
        <p className="mt-1 text-stone-dark capitalize">{RANGE_NOUN[range]} top climbers.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => {
              setRange(r.key);
              track("Leaderboard Range Changed", { range: r.key });
            }}
            aria-pressed={range === r.key}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              range === r.key
                ? "border-indigo bg-indigo text-parchment"
                : "border-stone/40 bg-white/60 text-ink hover:border-indigo"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {me && !me.signedIn && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-5 text-center">
          <p className="text-ink">Sign in to join the leaderboard.</p>
          <button
            type="button"
            onClick={handleSignIn}
            className="mt-3 rounded-full border-2 border-indigo px-6 py-2 font-medium text-indigo transition-colors hover:bg-indigo hover:text-parchment"
          >
            Continue with Google
          </button>
        </div>
      )}

      {error && <p className="text-sm text-indigo-dim">{error}</p>}

      {data && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-5">
          <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
            Score distribution
          </p>
          <p className="text-xs text-stone-dark">{RANGE_NOUN[data.range]} scores</p>
          <div className="mt-4">
            <ScoreHistogram buckets={data.histogram} />
          </div>
        </div>
      )}

      {data && data.entries.length === 0 && (
        <p className="text-center text-stone-dark">No scores yet for this range.</p>
      )}

      {data && data.entries.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {data.entries.map((e, i) => (
            <li
              key={`${e.username}-${i}`}
              className="flex items-center justify-between rounded-xl border border-stone/30 bg-white/60 px-4 py-2.5"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right font-serif-heading text-stone-dark">{i + 1}</span>
                <span className="font-medium text-ink">
                  {e.username}
                  {e.guest && <span className="ml-1.5 text-xs font-normal text-stone">guest</span>}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-stone">
                  {range === "today" ? "×" : "avg ×"}
                  {e.multiplier.toFixed(2)}
                </span>
                <span className="font-serif-heading text-lg font-semibold text-gold">{e.score}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <Link href="/bonus-leaderboard" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        Bonus Round leaderboard →
      </Link>
      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
