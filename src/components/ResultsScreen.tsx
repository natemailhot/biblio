"use client";

import { useState } from "react";
import { BRAND_EMOJI, MISS_EMOJI, TIER_META } from "@/lib/content/tiers";
import { BONUS_LEVEL_LABELS } from "@/lib/content/scriptureBonusScoring";
import { fetchJson } from "@/lib/fetchJson";
import { TierBadge } from "./TierBadge";
import type { QuestionResult, RankedAnswer, SessionResults } from "@/lib/types";

function AnswerRow({ a }: { a: RankedAnswer }) {
  const [open, setOpen] = useState(false);

  return (
    <li className={`rounded-md px-2 py-1.5 text-sm ${a.found ? "bg-olive/10" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className={a.found ? "font-medium text-olive" : "text-ink"}>{a.canonicalAnswer}</span>
          <TierBadge tier={a.tier} />
        </span>
        <span className="font-serif-heading text-gold">{a.score}</span>
      </button>
      {open && (
        <div className="mt-1.5 pl-1 text-xs text-stone-dark">
          <p>{a.explanation}</p>
          {a.references.length > 0 && (
            <p className="mt-1 text-stone">{a.references.map((r) => r.display).join(" · ")}</p>
          )}
        </div>
      )}
    </li>
  );
}

function QuestionCard({ q }: { q: QuestionResult }) {
  const hit = q.result === "accepted";
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-lg border border-stone/30 bg-white/60 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left"
      >
        <p className="text-xs uppercase tracking-wide text-stone">
          Question {q.slot} {q.guessCount > 0 && `· ${q.guessCount} guess${q.guessCount === 1 ? "" : "es"}`}
        </p>
        <p className="mt-1 font-medium text-ink">{q.prompt}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-sm text-stone-dark">
            {hit ? "Your answer: " : "Last guess: "}
            <span className="text-ink">{q.guess.trim() || "—"}</span>
          </span>
          <span className="flex items-center gap-2">
            {hit && q.tier && <TierBadge tier={q.tier} />}
            <span className={`font-serif-heading ${hit ? "text-gold" : "text-stone"}`}>
              {hit ? `+${q.score}` : "+0"}
            </span>
          </span>
        </div>
        {hit && q.explanation && (
          <p className="mt-2 text-sm text-stone-dark">
            {q.explanation}
            {q.isDailyGem && " ✦ Third Heaven — today's rarest find."}
          </p>
        )}
        {hit && q.references && q.references.length > 0 && (
          <p className="mt-1 text-xs text-stone">{q.references.map((r) => r.display).join(" · ")}</p>
        )}
        <p className="mt-2 text-xs font-medium text-indigo underline decoration-gold-soft underline-offset-4">
          {open ? "Hide all answers" : "Show all answers, highest to lowest"}
        </p>
      </button>

      {open && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-stone/20 pt-3">
          {q.allAnswers.map((a) => (
            <AnswerRow key={a.canonicalAnswer} a={a} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ResultsScreen({
  results,
  returning = false,
  sessionId,
  dailySetId,
}: {
  results: SessionResults;
  returning?: boolean;
  sessionId?: string;
  dailySetId?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const grid = results.questionResults
    .map((q) => (q.result === "accepted" && q.tier ? TIER_META[q.tier].shareEmoji : MISS_EMOJI))
    .join("");

  const shareCard = [
    `Ascend #${results.dayNumber} ${BRAND_EMOJI}`,
    `${results.totalScore}`,
    "",
    grid,
    "",
    `Scripture Bonus: ${results.scriptureBonusCorrect === true ? "✓" : results.scriptureBonusCorrect === false ? "✗" : "—"} ×${results.scriptureBonusMultiplier.toFixed(2)}`,
    "",
    "dailyascend.io",
  ].join("\n");

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: shareCard });
        return;
      } catch {
        // User cancelled the share sheet, or the browser rejected it —
        // fall through to clipboard so the action still does something.
      }
    }
    try {
      await navigator.clipboard.writeText(shareCard);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard may be unavailable; the card text is still visible below
    }
  };

  const submitReport = async () => {
    if (!reportMessage.trim() || reportSubmitting) return;
    setReportSubmitting(true);
    setReportError(null);
    try {
      await fetchJson("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ message: reportMessage.trim(), sessionId, dailySetId }),
      });
      setReportSent(true);
      setReportMessage("");
    } catch {
      setReportError("Something went wrong — try again.");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      {returning && (
        <p className="animate-rise-in rounded-full border border-gold-soft bg-white/60 px-4 py-2 text-center text-sm text-stone-dark">
          Welcome back — you&apos;ve already completed today&apos;s Ascend. Here&apos;s how you did.
        </p>
      )}
      <div className="text-center">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
          Ascend {BRAND_EMOJI} · Day {results.dayNumber}
        </p>
        <p className="font-serif-heading text-5xl font-semibold text-ink">{results.totalScore}</p>
        <p className="mt-1 text-stone-dark">total points</p>
      </div>

      <div className="rounded-2xl border border-gold-soft bg-white/60 p-6 text-center">
        <p className="text-2xl tracking-widest">{grid}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-stone/30 bg-white/60 p-4 text-center">
          <p className="text-sm text-stone-dark">Ascent score</p>
          <p className="font-serif-heading text-2xl font-semibold text-ink">{results.ascentScore}</p>
        </div>
        <div className="rounded-xl border border-stone/30 bg-white/60 p-4 text-center">
          <p className="text-sm text-stone-dark">Scripture Bonus</p>
          <p className="font-serif-heading text-2xl font-semibold text-ink">
            ×{results.scriptureBonusMultiplier.toFixed(2)}
          </p>
          <p className="text-xs text-stone">
            {results.scriptureBonusLevel
              ? results.scriptureBonusLevel === "skip"
                ? "Skipped"
                : `${results.scriptureBonusCorrect ? "Correct" : "Missed"} · ${BONUS_LEVEL_LABELS[results.scriptureBonusLevel]}`
              : "Not attempted"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-serif-heading text-lg font-semibold text-ink">Your climb</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {results.questionResults.map((q) => (
            <QuestionCard key={q.slot} q={q} />
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-gold-soft bg-white/60 p-5">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
          Scripture Bonus
        </p>
        <p className="mt-1 font-serif-heading text-xl font-semibold text-ink">
          {results.scriptureBonus.book} · {results.scriptureBonus.referenceDisplay}
        </p>
        <p className="mt-2 text-ink">“{results.scriptureBonus.displayText}”</p>
        <p className="mt-2 text-sm text-stone-dark">{results.scriptureBonus.contextNote}</p>
        <p className="mt-1 text-xs text-stone">{results.scriptureBonus.translation}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 rounded-full bg-indigo px-6 py-3 font-medium text-parchment transition-colors hover:bg-indigo-dim"
        >
          {copied ? "Copied to clipboard" : "Share spoiler-free result"}
        </button>
        <button
          type="button"
          onClick={() => setReportOpen((o) => !o)}
          aria-expanded={reportOpen}
          className="flex-1 rounded-full border-2 border-stone px-6 py-3 text-center font-medium text-stone-dark transition-colors hover:bg-white/60"
        >
          Report a missing answer
        </button>
      </div>

      {reportOpen && (
        <div className="animate-rise-in rounded-2xl border border-stone/30 bg-white/60 p-5">
          {reportSent ? (
            <p className="text-sm text-olive">
              Thanks — your report was sent. We&apos;ll take a look.
            </p>
          ) : (
            <>
              <label htmlFor="report-message" className="text-sm text-stone-dark">
                What&apos;s missing or wrong? A valid answer we didn&apos;t accept, a bad
                reference, anything.
              </label>
              <textarea
                id="report-message"
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                rows={3}
                maxLength={2000}
                className="mt-2 w-full rounded-xl border border-stone/40 bg-white px-4 py-3 text-ink focus:border-indigo"
                placeholder="e.g. “Elijah should also count for Question 2”"
              />
              {reportError && <p className="mt-2 text-sm text-indigo-dim">{reportError}</p>}
              <button
                type="button"
                onClick={submitReport}
                disabled={reportSubmitting || !reportMessage.trim()}
                className="mt-3 w-full rounded-full bg-indigo px-6 py-3 font-medium text-parchment disabled:opacity-50"
              >
                Send report
              </button>
            </>
          )}
        </div>
      )}

      <p className="text-center text-sm text-stone-dark">Come back tomorrow for Day {results.dayNumber + 1}.</p>
    </div>
  );
}
