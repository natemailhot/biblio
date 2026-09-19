"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { fetchJson } from "@/lib/fetchJson";
import type { AccountMeResponse, PlayerStats } from "@/lib/types";

const STAT_ROWS: { key: keyof PlayerStats; label: string; format: (v: number) => string }[] = [
  { key: "played", label: "Played", format: (v) => String(v) },
  { key: "dayStreak", label: "Day streak", format: (v) => String(v) },
  { key: "averageScore", label: "Average score", format: (v) => String(v) },
  { key: "bestScore", label: "Best day", format: (v) => String(v) },
  { key: "averageMultiplier", label: "Average Scripture Bonus", format: (v) => `×${v.toFixed(2)}` },
];

export default function StatsPage() {
  const [me, setMe] = useState<AccountMeResponse | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<AccountMeResponse>("/api/account/me")
      .then((res) => {
        setMe(res);
        if (res.signedIn && res.hasProfile) {
          return fetchJson<PlayerStats>("/api/stats").then(setStats);
        }
      })
      .catch(() => setError("Could not load stats."));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Stats
      </p>
      <h1 className="font-serif-heading text-3xl font-semibold text-ink">Your stats</h1>

      {me && !me.signedIn && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-6">
          <p className="text-ink">Sign in from the home screen to track your stats across every day you play.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
            ← Back to today&apos;s Ascend
          </Link>
        </div>
      )}

      {me && me.signedIn && !me.hasProfile && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-6">
          <p className="text-ink">Finish choosing a username on the home screen to see your stats.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
            ← Back to today&apos;s Ascend
          </Link>
        </div>
      )}

      {error && <p className="text-sm text-indigo-dim">{error}</p>}

      {stats && (
        <ul className="flex flex-col gap-3">
          {STAT_ROWS.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between rounded-xl border border-stone/30 bg-white/60 px-5 py-4"
            >
              <span className="text-stone-dark">{row.label}</span>
              <span className="font-serif-heading text-2xl font-semibold text-ink">{row.format(stats[row.key])}</span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/leaderboard" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        See the leaderboard →
      </Link>
    </div>
  );
}
