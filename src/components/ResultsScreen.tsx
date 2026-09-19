"use client";

import { useState } from "react";
import { TIER_META, TIER_ORDER } from "@/lib/content/tiers";
import { TierBadge } from "./TierBadge";
import type { FoundAnswer, MissedAnswer, SessionResults } from "@/lib/types";

function AnswerRow({ answer, missed = false }: { answer: FoundAnswer | MissedAnswer; missed?: boolean }) {
  return (
    <li className="rounded-lg border border-stone/30 bg-white/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-ink">{answer.canonicalAnswer}</span>
        <span className="flex items-center gap-2">
          <TierBadge tier={answer.tier} />
          <span className="font-serif-heading text-gold">
            {missed ? `${answer.score} pts` : `+${answer.score}`}
          </span>
        </span>
      </div>
      <p className="mt-2 text-sm text-stone-dark">{answer.explanation}</p>
      <p className="mt-1 text-xs text-stone">
        {answer.references.map((r) => r.display).join(" · ")}
      </p>
    </li>
  );
}

export function ResultsScreen({
  results,
  dateLabel,
}: {
  results: SessionResults;
  dateLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareCard = [
    `Scripture Dive — ${dateLabel}`,
    `${results.acceptedCount} answers · ${results.ascentScore} Ascent points`,
    `Scripture Bonus: ${results.scriptureBonusCorrect ? "✓" : "✗"} +${results.scriptureBonusScore}`,
    "",
    TIER_ORDER.map((t) => TIER_META[t].icon.repeat(Math.min(results.tierCounts[t], 3))).join(" ").trim(),
    "",
    "scripturedive.example",
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
          Results
        </p>
        <p className="font-serif-heading text-5xl font-semibold text-ink">{results.totalScore}</p>
        <p className="mt-1 text-stone-dark">total points</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-stone/30 bg-white/60 p-4 text-center">
          <p className="text-sm text-stone-dark">Ascent score</p>
          <p className="font-serif-heading text-2xl font-semibold text-ink">{results.ascentScore}</p>
          <p className="text-xs text-stone">{results.acceptedCount} answers found</p>
        </div>
        <div className="rounded-xl border border-stone/30 bg-white/60 p-4 text-center">
          <p className="text-sm text-stone-dark">Scripture Bonus</p>
          <p className="font-serif-heading text-2xl font-semibold text-ink">
            {results.scriptureBonusCorrect ? `+${results.scriptureBonusScore}` : "+0"}
          </p>
          <p className="text-xs text-stone">
            {results.scriptureBonusCorrect ? "Correct" : "Missed"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-serif-heading text-lg font-semibold text-ink">Your climb</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {TIER_ORDER.map((tier) => (
            <div key={tier} className="flex items-center gap-2 rounded-full border border-stone/30 bg-white/50 px-3 py-1.5">
              <TierBadge tier={tier} />
              <span className="text-sm text-stone-dark">×{results.tierCounts[tier]}</span>
            </div>
          ))}
        </div>
      </div>

      {results.dailyGem && (
        <div className="rounded-2xl border-2 border-gold bg-white/70 p-5">
          <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
            Daily Gem {results.dailyGem.found ? "· found" : "· missed"}
          </p>
          <p className="mt-1 font-serif-heading text-xl font-semibold text-ink">
            {results.dailyGem.canonicalAnswer}
          </p>
          <p className="mt-2 text-sm text-ink">{results.dailyGem.explanation}</p>
          <p className="mt-1 text-xs text-stone">
            {results.dailyGem.references.map((r) => r.display).join(" · ")}
          </p>
        </div>
      )}

      <div>
        <h3 className="font-serif-heading text-lg font-semibold text-ink">Found answers</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {results.foundAnswers.map((a) => (
            <AnswerRow key={a.canonicalAnswer} answer={a} />
          ))}
          {results.foundAnswers.length === 0 && (
            <p className="text-sm text-stone-dark">No answers found this round — there&apos;s always tomorrow.</p>
          )}
        </ul>
      </div>

      {results.missedHighValueAnswers.length > 0 && (
        <div>
          <h3 className="font-serif-heading text-lg font-semibold text-ink">Answers worth learning</h3>
          <p className="text-sm text-stone-dark">Higher-value answers you didn&apos;t find this time.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {results.missedHighValueAnswers.map((a) => (
              <AnswerRow key={a.canonicalAnswer} answer={a} missed />
            ))}
          </ul>
        </div>
      )}

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
          href="mailto:feedback@scripturedive.example?subject=Missing%20answer%20or%20issue"
          className="flex-1 rounded-full border-2 border-stone px-6 py-3 text-center font-medium text-stone-dark transition-colors hover:bg-white/60"
        >
          Report a missing answer
        </a>
      </div>

      <p className="text-center text-sm text-stone-dark">
        Come back tomorrow for the next Ascent.
      </p>
    </div>
  );
}
