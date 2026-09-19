"use client";

import Link from "next/link";
import { STAT_ROWS } from "@/lib/content/statRows";
import type { AccountMeResponse, PlayerStats } from "@/lib/types";

// Presentational: content shown inside the account popover. All data and
// handlers are owned by AccountButton so the trigger avatar and the panel
// share one fetch instead of each fetching independently.
export function AccountPanel({
  me,
  stats,
  username,
  onUsernameChange,
  submitting,
  error,
  onSignIn,
  onSignOut,
  onClaimUsername,
}: {
  me: AccountMeResponse;
  stats: PlayerStats | null;
  username: string;
  onUsernameChange: (value: string) => void;
  submitting: boolean;
  error: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onClaimUsername: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gold-soft bg-white/95 p-5 shadow-lg backdrop-blur">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">You</p>

      {!me.signedIn && (
        <>
          <p className="mt-2 text-sm text-stone-dark">
            An account keeps your finished puzzles on every device, puts you on the leaderboard,
            and shows you advanced stats.
          </p>
          <button
            type="button"
            onClick={onSignIn}
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
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="3-20 letters, numbers, _"
              maxLength={20}
              className="min-h-[2.75rem] flex-1 rounded-xl border border-stone/40 bg-white px-3 text-ink focus:border-indigo"
            />
            <button
              type="button"
              onClick={onClaimUsername}
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
            <button type="button" onClick={onSignOut} className="text-sm text-stone-dark underline decoration-gold-soft underline-offset-4">
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
            <div className="mt-3 grid grid-cols-3 gap-y-2 gap-x-2 text-center">
              {STAT_ROWS.map((row) => (
                <div key={row.key}>
                  <p className="font-serif-heading text-lg font-semibold text-ink">{row.format(stats[row.key])}</p>
                  <p className="text-[11px] leading-tight text-stone-dark">{row.label}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
