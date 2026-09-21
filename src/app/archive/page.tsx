"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { fetchJson } from "@/lib/fetchJson";
import { getCompletedSessionId } from "@/lib/completedSessions";
import type { AccountMeResponse, PlayerStats } from "@/lib/types";

type ArchiveDay = { dailySetId: string; dayNumber: number; date: string };

export default function ArchivePage() {
  const [days, setDays] = useState<ArchiveDay[] | null>(null);
  const [scoreByDay, setScoreByDay] = useState<Map<number, number>>(new Map());
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ days: ArchiveDay[] }>("/api/archive")
      .then((res) => {
        setDays(res.days);
        setPlayedIds(new Set(res.days.filter((d) => getCompletedSessionId(d.dailySetId)).map((d) => d.dailySetId)));
      })
      .catch(() => setError("Could not load the archive."));

    fetchJson<AccountMeResponse>("/api/account/me")
      .then((me) => {
        if (me.signedIn && me.hasProfile) {
          return fetchJson<PlayerStats>("/api/stats").then((stats) => {
            setScoreByDay(new Map(stats.history.map((h) => [h.dayNumber, h.score])));
          });
        }
      })
      .catch(() => {});
  }, []);

  // A day counts as played if this browser remembers it locally, OR the
  // server has a scored result for it (signed-in account, any device) —
  // the latter is what keeps a fresh device from under-counting.
  const isPlayed = (d: ArchiveDay) => playedIds.has(d.dailySetId) || scoreByDay.has(d.dayNumber);
  const playedCount = days?.filter(isPlayed).length ?? 0;
  const totalCount = days?.length ?? 0;
  const pct = totalCount > 0 ? Math.round((playedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Archive
      </p>
      <div>
        <h1 className="font-serif-heading text-3xl font-semibold text-ink">Archive</h1>
        {days && (
          <p className="mt-1 text-stone-dark">
            {playedCount} of {totalCount} played · {pct}%
          </p>
        )}
      </div>

      {error && <p className="text-sm text-indigo-dim">{error}</p>}

      {days && (
        <ul className="flex flex-col gap-1.5">
          {days.map((d) => {
            const played = isPlayed(d);
            const score = scoreByDay.get(d.dayNumber);
            return (
              <li key={d.dailySetId}>
                <Link
                  href={`/day/${d.date}`}
                  className="flex items-center justify-between rounded-xl border border-stone/30 bg-white/60 px-4 py-3 transition-colors hover:border-indigo"
                >
                  <span className="text-ink">
                    Day {d.dayNumber} <span className="text-xs text-stone">· {d.date}</span>
                  </span>
                  {played ? (
                    <span className="flex items-center gap-2 text-sm text-olive">
                      {score != null && <span className="font-serif-heading font-semibold text-gold">{score}</span>}
                      ✓ Played
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-indigo">Play →</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
