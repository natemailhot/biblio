"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/fetchJson";
import { getCompletedSessionId } from "@/lib/completedSessions";
import type { AccountMeResponse, LeaderboardResponse } from "@/lib/types";

type ArchiveDay = { dailySetId: string; dayNumber: number; date: string };

// Fixed circular trigger in the top-left corner (bottom-left on mobile,
// mirroring AccountButton's bottom-right placement), persistent across
// every screen. Opens a popover with an archive summary, today's
// leaderboard snapshot, and the site's secondary links.
export function MenuButton() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<ArchiveDay[] | null>(null);
  const [playedCount, setPlayedCount] = useState(0);
  const [me, setMe] = useState<AccountMeResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    fetchJson<{ days: ArchiveDay[] }>("/api/archive")
      .then((res) => {
        setDays(res.days);
        setPlayedCount(res.days.filter((d) => getCompletedSessionId(d.dailySetId)).length);
      })
      .catch(() => {});
    fetchJson<AccountMeResponse>("/api/account/me")
      .then(setMe)
      .catch(() => setMe({ signedIn: false }));
    fetchJson<LeaderboardResponse>("/api/leaderboard?range=today")
      .then(setLeaderboard)
      .catch(() => {});
  };

  useEffect(refresh, []);

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

  const total = days?.length ?? 0;
  const pct = total > 0 ? Math.round((playedCount / total) * 100) : 0;
  const topThree = leaderboard?.entries.slice(0, 3) ?? [];

  return (
    <div ref={containerRef} className="fixed bottom-4 left-4 z-20 sm:bottom-auto sm:top-4">
      <button
        type="button"
        onClick={() => {
          if (!open) refresh();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label="Menu"
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gold-soft bg-white/90 text-lg shadow-md transition-colors hover:border-indigo"
      >
        📜
      </button>

      {open && (
        <div className="animate-rise-in absolute bottom-14 left-0 w-80 max-w-[calc(100vw-2rem)] sm:bottom-auto sm:top-14">
          <div className="flex flex-col gap-4 rounded-2xl border border-gold-soft bg-white/95 p-5 shadow-lg backdrop-blur">
            <div>
              <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">Archive</p>
              {days && (
                <p className="mt-1 text-sm text-stone-dark">
                  {playedCount} of {total} played · {pct}%
                </p>
              )}
              <Link
                href="/archive"
                onClick={() => setOpen(false)}
                className="mt-1 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4"
              >
                Open the archive →
              </Link>
            </div>

            <div className="border-t border-stone/20 pt-4">
              <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
                Leaderboard · Today
              </p>
              <Link
                href="/leaderboard"
                onClick={() => setOpen(false)}
                className="mt-1 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4"
              >
                See full leaderboard →
              </Link>

              {me && !me.signedIn ? (
                <p className="mt-2 text-sm text-stone-dark">Log in or create an account to join the leaderboard.</p>
              ) : (
                <ol className="mt-2 flex flex-col gap-1 text-sm">
                  {topThree.length === 0 && <li className="text-stone-dark">No scores yet today.</li>}
                  {topThree.map((e, i) => (
                    <li key={`${e.username}-${i}`} className="flex items-center justify-between">
                      <span className="text-ink">
                        {i + 1}. {e.username}
                      </span>
                      <span className="text-xs text-stone">×{e.multiplier.toFixed(2)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-stone/20 pt-4 text-sm">
              <Link href="/submit-question" onClick={() => setOpen(false)} className="text-indigo underline decoration-gold-soft underline-offset-4">
                Submit a question
              </Link>
              <Link href="/feedback" onClick={() => setOpen(false)} className="text-indigo underline decoration-gold-soft underline-offset-4">
                Feedback
              </Link>
              <Link href="/about" onClick={() => setOpen(false)} className="text-indigo underline decoration-gold-soft underline-offset-4">
                About
              </Link>
              <Link href="/privacy" onClick={() => setOpen(false)} className="text-indigo underline decoration-gold-soft underline-offset-4">
                Privacy
              </Link>
            </div>

            <p className="text-center text-xs text-stone">made by Wain Famous</p>
          </div>
        </div>
      )}
    </div>
  );
}
