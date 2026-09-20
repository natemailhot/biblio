"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { STAT_ROWS } from "@/lib/content/statRows";
import { BADGES } from "@/lib/content/badges";
import { fetchJson } from "@/lib/fetchJson";
import type { AccountMeResponse, PlayerStats } from "@/lib/types";

export default function StatsPage() {
  const [me, setMe] = useState<AccountMeResponse | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    if (!stats) return;
    const text = [
      `Ascend ${BRAND_EMOJI} stats`,
      ...STAT_ROWS.map((row) => `${row.label}: ${row.format(stats[row.key])}`),
      "",
      "dailyascend.io",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard may be unavailable
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Stats
      </p>
      <h1 className="font-serif-heading text-3xl font-semibold text-ink">Your stats</h1>

      {me && !me.signedIn && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-6">
          <p className="text-ink">You&apos;re playing signed out. Sign in from the account button to track your stats across every day you play.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
            ← Back to today&apos;s Ascend
          </Link>
        </div>
      )}

      {me && me.signedIn && !me.hasProfile && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-6">
          <p className="text-ink">Finish choosing a username from the account button to see your stats.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
            ← Back to today&apos;s Ascend
          </Link>
        </div>
      )}

      {error && <p className="text-sm text-indigo-dim">{error}</p>}

      {stats && (
        <>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full rounded-full bg-indigo px-6 py-3 font-medium text-parchment transition-colors hover:bg-indigo-dim"
          >
            {copied ? "Copied to clipboard" : "Copy Text"}
          </button>

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

          <div>
            <h2 className="font-serif-heading text-lg font-semibold text-ink">Badges</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {BADGES.map((b) => {
                const earned = b.earned(stats);
                return (
                  <li
                    key={b.key}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                      earned ? "border-gold-soft bg-white/60" : "border-stone/20 bg-white/20 opacity-50"
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">
                      {b.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">{b.label}</span>
                      <span className="block text-xs text-stone-dark">{b.description}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="font-serif-heading text-lg font-semibold text-ink">Score history</h2>
            {stats.history.length === 0 ? (
              <p className="mt-2 text-stone-dark">No completed days yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1.5">
                {stats.history.map((h) => (
                  <li
                    key={h.dayNumber}
                    className="flex items-center justify-between rounded-xl border border-stone/30 bg-white/60 px-4 py-2.5"
                  >
                    <span className="text-ink">
                      Day {h.dayNumber} <span className="text-xs text-stone">· {h.date}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-stone">×{h.multiplier.toFixed(2)}</span>
                      <span className="font-serif-heading text-lg font-semibold text-gold">{h.score}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Link href="/leaderboard" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        See the leaderboard →
      </Link>
    </div>
  );
}
