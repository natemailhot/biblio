"use client";

import { useMemo, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { PROTESTANT_66_BOOKS } from "@/lib/content/bibleBooks";
import type { DailyChallengeSummary, SubmitBonusResponse } from "@/lib/types";

export function BonusScreen({
  challenge,
  sessionId,
  onDone,
}: {
  challenge: DailyChallengeSummary;
  sessionId: string;
  onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reveal, setReveal] = useState<SubmitBonusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PROTESTANT_66_BOOKS.filter((b) => b.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const submitGuess = async (rawInput: string) => {
    if (!rawInput.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchJson<SubmitBonusResponse>(`/api/sessions/${sessionId}/bonus`, {
        method: "POST",
        body: JSON.stringify({ rawInput }),
      });
      setReveal(res);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (reveal) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
          Scripture Bonus
        </p>
        <div className="animate-rise-in rounded-2xl border border-gold-soft bg-white/70 p-6">
          <p className={`font-serif-heading text-2xl font-semibold ${reveal.correct ? "text-olive" : "text-indigo-dim"}`}>
            {reveal.correct ? "Correct" : "Not quite"} — {reveal.book} · {reveal.referenceDisplay}
          </p>
          <p className="mt-1 text-gold">
            {reveal.correct ? `+${reveal.score} points` : "+0 points"}
          </p>
          <p className="mt-4 text-ink">{reveal.contextNote}</p>
          <p className="mt-4 text-xs text-stone">{reveal.translation}</p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-full bg-indigo px-6 py-4 text-lg font-medium text-parchment transition-colors hover:bg-indigo-dim"
        >
          See results
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Scripture Bonus · +25
      </p>
      <blockquote className="font-serif-heading rounded-2xl border border-gold-soft bg-white/60 p-6 text-xl italic text-ink">
        “{challenge.scriptureBonus.displayText}”
      </blockquote>
      <p className="text-lg text-stone-dark">Which book is this from?</p>

      <div className="relative">
        <label htmlFor="bonus-input" className="sr-only">
          Search Bible books
        </label>
        <input
          id="bonus-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitGuess(query);
          }}
          placeholder="Search Bible books…"
          className="min-h-[3rem] w-full rounded-xl border border-stone/40 bg-white px-4 text-lg text-ink focus:border-indigo"
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-stone/30 bg-white shadow-md">
            {suggestions.map((book) => (
              <li key={book}>
                <button
                  type="button"
                  onClick={() => submitGuess(book)}
                  className="block w-full px-4 py-2 text-left text-ink hover:bg-parchment-dim"
                >
                  {book}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-indigo-dim">{error}</p>}

      <button
        type="button"
        onClick={() => submitGuess(query)}
        disabled={submitting || !query.trim()}
        className="w-full rounded-full bg-indigo px-6 py-4 text-lg font-medium text-parchment disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  );
}
