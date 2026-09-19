"use client";

import { useState } from "react";
import { BRAND_EMOJI, MISS_EMOJI, TIER_META } from "@/lib/content/tiers";
import { TierBadge } from "./TierBadge";
import type { QuestionResult, SessionResults } from "@/lib/types";

function QuestionCard({ q }: { q: QuestionResult }) {
  const hit = q.result === "accepted";
  return (
    <li className="rounded-lg border border-stone/30 bg-white/60 p-4">
      <p className="text-xs uppercase tracking-wide text-stone">Question {q.slot}</p>
      <p className="mt-1 font-medium text-ink">{q.prompt}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-sm text-stone-dark">
          Your guess: <span className="text-ink">{q.guess.trim() || "—"}</span>
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
      {!hit && q.bestMissedAnswer && (
        <p className="mt-2 text-sm text-stone-dark">
          A top answer was <span className="font-medium text-ink">{q.bestMissedAnswer.canonicalAnswer}</span>{" "}
          ({q.bestMissedAnswer.explanation})
        </p>
      )}
      {hit && q.references && q.references.length > 0 && (
        <p className="mt-1 text-xs text-stone">{q.references.map((r) => r.display).join(" · ")}</p>
      )}
    </li>
  );
}

export function ResultsScreen({ results }: { results: SessionResults }) {
  const [copied, setCopied] = useState(false);

  const grid = results.questionResults
    .map((q) => (q.result === "accepted" && q.tier ? TIER_META[q.tier].shareEmoji : MISS_EMOJI))
    .join("");

  const shareCard = [
    `Ascend #${results.dayNumber} ${BRAND_EMOJI}`,
    `${results.totalScore}`,
    "",
    grid,
    "",
    `Scripture Bonus: ${results.scriptureBonusCorrect ? "✓" : "✗"} +${results.scriptureBonusScore}`,
  ].join("\n");

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareCard);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard may be unavailable; the card text is still visible below
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
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
            {results.scriptureBonusCorrect ? `+${results.scriptureBonusScore}` : "+0"}
          </p>
          <p className="text-xs text-stone">{results.scriptureBonusCorrect ? "Correct" : "Missed"}</p>
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
        <a
          href="mailto:feedback@ascend.example?subject=Missing%20answer%20or%20issue"
          className="flex-1 rounded-full border-2 border-stone px-6 py-3 text-center font-medium text-stone-dark transition-colors hover:bg-white/60"
        >
          Report a missing answer
        </a>
      </div>

      <p className="text-center text-sm text-stone-dark">Come back tomorrow for Day {results.dayNumber + 1}.</p>
    </div>
  );
}
