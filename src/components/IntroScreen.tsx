"use client";

import { useState } from "react";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import type { DailySetSummary } from "@/lib/types";

export function IntroScreen({
  dailySet,
  onBegin,
}: {
  dailySet: DailySetSummary;
  onBegin: (accessibilityMode: boolean) => void;
}) {
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const questionCount = dailySet.questions.length;
  const perQuestionSeconds = dailySet.questions[0]?.durationSeconds ?? 15;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3 text-center">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
          Ascend {BRAND_EMOJI}
        </p>
        <h1 className="font-serif-heading text-4xl font-semibold text-ink">Day {dailySet.dayNumber}</h1>
        <p className="text-lg text-stone-dark">
          {questionCount} questions, one guess each. Climb as high as you can — from the Outer
          Court toward the Third Heaven.
        </p>
      </div>

      <div className="rounded-2xl border border-gold-soft bg-white/60 p-6 shadow-sm">
        <p className="text-ink">
          Each question has many possible valid answers, curated by depth — but you only get one
          guess per question, so make it count. After all {questionCount}, a short Scripture
          Bonus asks you to name the book a verse comes from.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-stone/40 bg-white/50 px-4 py-3 text-sm text-stone-dark">
        <input
          type="checkbox"
          className="h-5 w-5 accent-indigo"
          checked={accessibilityMode}
          onChange={(e) => setAccessibilityMode(e.target.checked)}
        />
        No timer — accessibility mode (scores are labeled separately)
      </label>

      <button
        type="button"
        onClick={() => onBegin(accessibilityMode)}
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
