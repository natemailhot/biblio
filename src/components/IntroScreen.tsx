"use client";

import { BRAND_EMOJI } from "@/lib/content/tiers";
import { BONUS_MULTIPLIERS } from "@/lib/content/scriptureBonusScoring";
import type { DailySetSummary } from "@/lib/types";

export function IntroScreen({
  dailySet,
  onBegin,
}: {
  dailySet: DailySetSummary;
  onBegin: () => void;
}) {
  const questionCount = dailySet.questions.length;
  const perQuestionSeconds = dailySet.questions[0]?.durationSeconds ?? 25;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3 text-center">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
          Ascend {BRAND_EMOJI}
        </p>
        <h1 className="font-serif-heading text-4xl font-semibold text-ink">Day {dailySet.dayNumber}</h1>
        <p className="text-lg text-stone-dark">
          {questionCount} questions. Climb as high as you can — from the Outer Court toward the
          Third Heaven.
        </p>
      </div>

      <div className="rounded-2xl border border-gold-soft bg-white/60 p-6 shadow-sm">
        <p className="text-ink">
          Each question has many possible valid answers, curated by depth — keep guessing until
          you get it or time runs out. Rarer, less obvious answers score higher than the obvious
          ones.
        </p>
      </div>

      <div className="rounded-2xl border border-gold-soft bg-white/60 p-6 shadow-sm">
        <p className="text-ink">
          After all {questionCount} questions, a Scripture Bonus verse appears. Guessing its
          Testament multiplies your Ascent score by ×{BONUS_MULTIPLIERS.testament.toFixed(1)}, the
          book by ×{BONUS_MULTIPLIERS.book.toFixed(1)}, book and chapter by ×
          {BONUS_MULTIPLIERS.chapter.toFixed(1)}, and book, chapter, and verse by ×
          {BONUS_MULTIPLIERS.verse.toFixed(1)}. You choose how precisely to guess, but only get one
          shot — a wrong or missing guess leaves your score unchanged.
        </p>
      </div>

      <button
        type="button"
        onClick={onBegin}
        className="w-full rounded-full bg-indigo px-6 py-4 text-lg font-medium text-parchment transition-colors hover:bg-indigo-dim"
      >
        Begin the Ascent
      </button>

      <p className="text-center text-xs text-stone">
        {perQuestionSeconds}s per question · No account required
      </p>
    </div>
  );
}
