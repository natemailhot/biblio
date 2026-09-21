"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { fetchJson } from "@/lib/fetchJson";
import { getCompletedSessionId } from "@/lib/completedSessions";
import type { AccountMeResponse, PlayerStats } from "@/lib/types";

type ArchiveDay = { dailySetId: string; dayNumber: number; date: string };
type Filter = "all" | "played" | "unplayed";
type View = "list" | "calendar";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "played", label: "Completed" },
  { key: "unplayed", label: "To play" },
];

export default function ArchivePage() {
  const [days, setDays] = useState<ArchiveDay[] | null>(null);
  const [scoreByDay, setScoreByDay] = useState<Map<number, number>>(new Map());
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("list");
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
        setSignedIn(me.signedIn);
        if (me.signedIn && me.hasProfile) {
          return fetchJson<PlayerStats>("/api/stats").then((s) => {
            setStats(s);
            setScoreByDay(new Map(s.history.map((h) => [h.dayNumber, h.score])));
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

  const visibleDays = (days ?? []).filter((d) => {
    if (filter === "played") return isPlayed(d);
    if (filter === "unplayed") return !isPlayed(d);
    return true;
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Archive
      </p>
      <div>
        <h1 className="font-serif-heading text-3xl font-semibold text-ink">Archive</h1>
        <p className="mt-1 text-stone-dark">Every day since Day 1. Replay any of them.</p>
        {days && (
          <p className="mt-1 text-sm text-stone">
            {playedCount} of {totalCount} played · {pct}%
          </p>
        )}
      </div>

      {stats && stats.played > 0 ? (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gold-soft bg-white/60 p-4 sm:grid-cols-4">
          {[
            { label: "Played", value: stats.played },
            { label: "Day streak", value: stats.dayStreak },
            { label: "Average score", value: stats.averageScore },
            { label: "Best score", value: stats.bestScore },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-serif-heading text-xl font-semibold text-gold">{s.value}</p>
              <p className="text-xs uppercase tracking-wide text-stone">{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        !signedIn && (
          <p className="rounded-2xl border border-gold-soft bg-white/60 p-4 text-sm text-stone-dark">
            Log in or create an account to track your average score, best score, and day streak.
          </p>
        )
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                filter === f.key
                  ? "border-indigo bg-indigo text-parchment"
                  : "border-stone/40 bg-white/60 text-ink hover:border-indigo"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl border border-stone/40 bg-white/60 p-1">
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v ? "bg-indigo text-parchment" : "text-ink hover:bg-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-indigo-dim">{error}</p>}

      {days && view === "calendar" && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-4">
          {visibleDays.length === 0 ? (
            <p className="px-2 py-6 text-center text-stone-dark">Nothing here yet.</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {[...visibleDays].reverse().map((d) => {
                const played = isPlayed(d);
                const score = scoreByDay.get(d.dayNumber);
                return (
                  <Link
                    key={d.dailySetId}
                    href={`/day/${d.date}`}
                    title={`Day ${d.dayNumber} · ${d.date}${score != null ? ` · ${score}` : ""}`}
                    className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                      played
                        ? "border-gold bg-gold/25 text-ink hover:bg-gold/40"
                        : "border-stone/30 bg-white/40 text-stone-dark hover:border-indigo"
                    }`}
                  >
                    <span className="font-serif-heading tabular-nums">{d.dayNumber}</span>
                    {score != null && <span className="text-[10px] text-gold">{score}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {days && view === "list" && (
        <div className="overflow-hidden rounded-2xl border border-gold-soft bg-white/60">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stone/20 text-xs uppercase tracking-wide text-stone">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  No.
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Date
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Score
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleDays.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-stone-dark">
                    Nothing here yet.
                  </td>
                </tr>
              )}
              {visibleDays.map((d) => {
                const played = isPlayed(d);
                const score = scoreByDay.get(d.dayNumber);
                return (
                  <tr key={d.dailySetId} className="border-b border-stone/10 last:border-0 hover:bg-white/60">
                    <td className="px-4 py-3">
                      <Link href={`/day/${d.date}`} className="block font-serif-heading text-stone-dark tabular-nums">
                        {String(d.dayNumber).padStart(3, "0")}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/day/${d.date}`} className="block text-ink">
                        {d.date}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/day/${d.date}`} className="block font-serif-heading font-semibold text-gold">
                        {score != null ? score : played ? "✓" : "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/day/${d.date}`}
                        className={`block text-sm font-medium ${played ? "text-olive" : "text-indigo"}`}
                      >
                        {played ? "Completed" : "Play →"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
