"use client";

import { useMemo, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { getBooksForCanon } from "@/lib/content/bibleBooks";
import {
  BONUS_INCORRECT_MULTIPLIER,
  BONUS_LEVEL_LABELS,
  BONUS_MULTIPLIERS,
} from "@/lib/content/scriptureBonusScoring";
import type {
  DailySetSummary,
  ScriptureBonusGuessLevel,
  ScriptureBonusLevel,
  SubmitBonusRequest,
  SubmitBonusResponse,
  Testament,
} from "@/lib/types";

const GUESS_LEVELS: ScriptureBonusGuessLevel[] = ["testament", "book", "chapter", "verse"];

export function BonusScreen({
  dailySet,
  sessionId,
  onDone,
}: {
  dailySet: DailySetSummary;
  sessionId: string;
  onDone: () => void;
}) {
  const [level, setLevel] = useState<ScriptureBonusLevel>("book");
  const [testament, setTestament] = useState<Testament | null>(null);
  const [bookQuery, setBookQuery] = useState("");
  const [chapter, setChapter] = useState("");
  const [verse, setVerse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reveal, setReveal] = useState<SubmitBonusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const books = useMemo(
    () => getBooksForCanon(dailySet.scriptureBonus.canonScope),
    [dailySet.scriptureBonus.canonScope]
  );

  const suggestions = useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    if (!q || books.includes(bookQuery.trim())) return [];
    return books.filter((b) => b.toLowerCase().includes(q)).slice(0, 8);
  }, [bookQuery, books]);

  const canSubmit =
    level === "skip"
      ? true
      : level === "testament"
        ? testament !== null
        : level === "book"
          ? bookQuery.trim().length > 0
          : level === "chapter"
            ? bookQuery.trim().length > 0 && chapter.trim().length > 0
            : bookQuery.trim().length > 0 && chapter.trim().length > 0 && verse.trim().length > 0;

  const submitGuess = async () => {
    if (!canSubmit || submitting) return;

    let payload: SubmitBonusRequest;
    if (level === "skip") {
      payload = { level: "skip" };
    } else if (level === "testament") {
      payload = { level: "testament", testament: testament! };
    } else if (level === "book") {
      payload = { level: "book", book: bookQuery.trim() };
    } else if (level === "chapter") {
      payload = { level: "chapter", book: bookQuery.trim(), chapter: Number(chapter) };
    } else {
      payload = { level: "verse", book: bookQuery.trim(), chapter: Number(chapter), verse: Number(verse) };
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchJson<SubmitBonusResponse>(`/api/sessions/${sessionId}/bonus`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setReveal(res);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (reveal) {
    const tone = reveal.correct === true ? "text-olive" : reveal.correct === false ? "text-indigo-dim" : "text-stone-dark";
    const headline =
      reveal.correct === true ? "Correct" : reveal.correct === false ? "Not quite" : "No guess made";
    const multiplierNote =
      reveal.correct === true
        ? `×${reveal.multiplier.toFixed(2)} on your Ascent score`
        : reveal.correct === false
          ? `×${reveal.multiplier.toFixed(2)} penalty on your Ascent score`
          : "×1.00 — no change to your Ascent score";

    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
          Scripture Bonus
        </p>
        <div className="animate-rise-in rounded-2xl border border-gold-soft bg-white/70 p-6">
          <p className={`font-serif-heading text-2xl font-semibold ${tone}`}>
            {headline} — {reveal.book} · {reveal.referenceDisplay}
          </p>
          <p className="mt-1 text-gold">{multiplierNote}</p>
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
        Scripture Bonus
      </p>
      <blockquote className="font-serif-heading rounded-2xl border border-gold-soft bg-white/60 p-6 text-xl italic text-ink">
        “{dailySet.scriptureBonus.displayText}”
      </blockquote>

      <div>
        <p className="text-sm text-stone-dark">
          Choose how precisely you&apos;ll guess. You get one shot — a wrong guess costs a ×
          {BONUS_INCORRECT_MULTIPLIER.toFixed(2)} penalty on your Ascent score. Not sure? Pick
          &quot;I don&apos;t know&quot; below for no risk.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {GUESS_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLevel(l);
                setError(null);
              }}
              aria-pressed={level === l}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                level === l
                  ? "border-indigo bg-indigo text-parchment"
                  : "border-stone/40 bg-white/60 text-ink hover:border-indigo"
              }`}
            >
              {BONUS_LEVEL_LABELS[l]}
              <span className="block text-xs opacity-80">×{BONUS_MULTIPLIERS[l].toFixed(2)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setLevel("skip");
            setError(null);
          }}
          aria-pressed={level === "skip"}
          className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
            level === "skip"
              ? "border-stone-dark bg-stone-dark text-parchment"
              : "border-stone/40 bg-white/40 text-stone-dark hover:border-stone-dark"
          }`}
        >
          {BONUS_LEVEL_LABELS.skip}
          <span className="block text-xs opacity-80">×1.00 — no risk</span>
        </button>
      </div>

      {level === "testament" ? (
        <div className="grid grid-cols-2 gap-2">
          {(["Old", "New"] as Testament[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTestament(t)}
              aria-pressed={testament === t}
              className={`rounded-xl border px-4 py-3 text-base font-medium transition-colors ${
                testament === t
                  ? "border-indigo bg-indigo text-parchment"
                  : "border-stone/40 bg-white text-ink hover:border-indigo"
              }`}
            >
              {t} Testament
            </button>
          ))}
        </div>
      ) : (
        level !== "skip" && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <label htmlFor="bonus-book-input" className="sr-only">
                Search Bible books
              </label>
              <input
                id="bonus-book-input"
                type="text"
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
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
                        onClick={() => setBookQuery(book)}
                        className="block w-full px-4 py-2 text-left text-ink hover:bg-parchment-dim"
                      >
                        {book}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(level === "chapter" || level === "verse") && (
              <label className="flex items-center gap-2 text-sm text-stone-dark">
                Chapter
                <input
                  type="number"
                  min={1}
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="min-h-[2.75rem] w-24 rounded-xl border border-stone/40 bg-white px-3 text-lg text-ink focus:border-indigo"
                />
              </label>
            )}

            {level === "verse" && (
              <label className="flex items-center gap-2 text-sm text-stone-dark">
                Verse
                <input
                  type="number"
                  min={1}
                  value={verse}
                  onChange={(e) => setVerse(e.target.value)}
                  className="min-h-[2.75rem] w-24 rounded-xl border border-stone/40 bg-white px-3 text-lg text-ink focus:border-indigo"
                />
              </label>
            )}
          </div>
        )
      )}

      {error && <p className="text-sm text-indigo-dim">{error}</p>}

      <button
        type="button"
        onClick={submitGuess}
        disabled={submitting || !canSubmit}
        className="w-full rounded-full bg-indigo px-6 py-4 text-lg font-medium text-parchment disabled:opacity-50"
      >
        Lock In
      </button>
    </div>
  );
}
