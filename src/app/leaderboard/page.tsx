"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { BADGES } from "@/lib/content/badges";
import { fetchJson } from "@/lib/fetchJson";
import { createBrowserSupabaseClient } from "@/lib/supabase/browserClient";
import { ScoreHistogram } from "@/components/ScoreHistogram";
import type { AccountMeResponse, LeaderboardRange, LeaderboardResponse } from "@/lib/types";

type Tab = LeaderboardRange | "badges";

const RANGE_NOUN: Record<"today" | "week" | "all", string> = {
  today: "today's",
  week: "this week's",
  all: "all-time",
};

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 days" },
  { key: "all", label: "All time" },
  { key: "streaks", label: "Streaks" },
  { key: "badges", label: "Badges" },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [me, setMe] = useState<AccountMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<AccountMeResponse>("/api/account/me")
      .then(setMe)
      .catch(() => setMe({ signedIn: false }));
  }, []);

  useEffect(() => {
    if (tab === "badges") return;
    fetchJson<LeaderboardResponse>(`/api/leaderboard?range=${tab}`)
      .then((res) => {
        setError(null);
        setData(res);
      })
      .catch(() => setError("Could not load the leaderboard."));
  }, [tab]);

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
        <p className="mt-1 text-stone-dark">Today&apos;s top climbers.</p>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
              tab === t.key
                ? "border-indigo bg-indigo text-parchment"
                : "border-stone/40 bg-white/60 text-ink hover:border-indigo"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {me && !me.signedIn && tab !== "badges" && (
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

      {tab === "badges" && (
        <ul className="flex flex-col gap-2">
          {BADGES.map((b) => (
            <li key={b.key} className="flex items-center gap-3 rounded-xl border border-stone/30 bg-white/60 px-4 py-3">
              <span className="text-2xl" aria-hidden="true">
                {b.icon}
              </span>
              <span>
                <span className="block font-medium text-ink">{b.label}</span>
                <span className="block text-sm text-stone-dark">{b.description}</span>
              </span>
            </li>
          ))}
          <li className="text-center text-xs text-stone">
            Sign in and check your <Link href="/stats" className="underline decoration-gold-soft underline-offset-4">stats page</Link> to see which you&apos;ve earned.
          </li>
        </ul>
      )}

      {tab !== "badges" && data && data.range !== "streaks" && (
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

      {tab !== "badges" && data && data.entries.length === 0 && (
        <p className="text-center text-stone-dark">
          {data.range === "streaks" ? "No active streaks yet." : "No scores yet for this range."}
        </p>
      )}

      {tab !== "badges" && data && data.range === "streaks" && data.entries.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {data.entries.map((e, i) => (
            <li
              key={`${e.username}-${i}`}
              className="flex items-center justify-between rounded-xl border border-stone/30 bg-white/60 px-4 py-2.5"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right font-serif-heading text-stone-dark">{i + 1}</span>
                <span className="font-medium text-ink">{e.username}</span>
              </span>
              <span className="font-serif-heading text-lg font-semibold text-gold">🔥 {e.streak}</span>
            </li>
          ))}
        </ol>
      )}

      {tab !== "badges" && data && data.range !== "streaks" && data.entries.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {data.entries.map((e, i) => (
            <li
              key={`${e.username}-${i}`}
              className="flex items-center justify-between rounded-xl border border-stone/30 bg-white/60 px-4 py-2.5"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right font-serif-heading text-stone-dark">{i + 1}</span>
                <span className="font-medium text-ink">{e.username}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-stone">×{e.multiplier.toFixed(2)}</span>
                <span className="font-serif-heading text-lg font-semibold text-gold">{e.score}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
