"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { fetchJson } from "@/lib/fetchJson";
import { ScoreHistogram } from "@/components/ScoreHistogram";
import type { BonusLeaderboardResponse, LeaderboardRange } from "@/lib/types";

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

export default function BonusLeaderboardPage() {
  const [range, setRange] = useState<LeaderboardRange>("today");
  const [data, setData] = useState<BonusLeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<BonusLeaderboardResponse>(`/api/bonus-leaderboard?range=${range}`)
      .then((res) => {
        setError(null);
        setData(res);
      })
      .catch(() => setError("Could not load the bonus leaderboard."));
  }, [range]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Bonus Leaderboard
      </p>
      <div>
        <h1 className="font-serif-heading text-3xl font-semibold text-ink">Bonus Leaderboard</h1>
        <p className="mt-1 text-stone-dark">
          Ranked by the optional 5-minute bonus round — separate from the main leaderboard.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
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

      {error && <p className="text-sm text-indigo-dim">{error}</p>}

      {data && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-5">
          <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
            Score distribution
          </p>
          <p className="text-xs text-stone-dark">{RANGE_NOUN[data.range]} bonus round scores</p>
          <div className="mt-4">
            <ScoreHistogram buckets={data.histogram} />
          </div>
        </div>
      )}

      {data && data.entries.length === 0 && (
        <p className="text-center text-stone-dark">No bonus round scores yet for this range.</p>
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
                <span className="font-medium text-ink">{e.username}</span>
              </span>
              <span className="font-serif-heading text-lg font-semibold text-gold">{e.score}</span>
            </li>
          ))}
        </ol>
      )}

      <Link href="/leaderboard" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Main leaderboard
      </Link>
      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
