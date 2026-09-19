"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { TierBadge } from "./TierBadge";
import type { AnswerTier, DailyChallengeSummary, SubmitAnswerResponse } from "@/lib/types";

type FoundEntry = { canonicalAnswer: string; score: number; tier: AnswerTier };

export function AscentScreen({
  challenge,
  sessionId,
  accessibilityMode,
  onFinished,
}: {
  challenge: DailyChallengeSummary;
  sessionId: string;
  accessibilityMode: boolean;
  onFinished: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(challenge.durationSeconds);
  const [found, setFound] = useState<FoundEntry[]>([]);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "accepted" | "duplicate" | "invalid"; message: string } | null>(null);
  const [whatCountsOpen, setWhatCountsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const finishedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const finish = async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishing(true);
    try {
      await fetchJson(`/api/sessions/${sessionId}/finish`, { method: "POST" });
    } finally {
      onFinished();
    }
  };

  useEffect(() => {
    if (accessibilityMode) return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, accessibilityMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    if (!raw || submitting) return;
    setSubmitting(true);
    setInput("");
    try {
      const res = await fetchJson<SubmitAnswerResponse>(`/api/sessions/${sessionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ rawInput: raw }),
      });

      if (res.result === "accepted" && res.canonicalAnswer && res.tier) {
        setFound((f) => [{ canonicalAnswer: res.canonicalAnswer!, score: res.score, tier: res.tier! }, ...f]);
        setScore((s) => s + res.score);
        setFeedback({ tone: "accepted", message: res.message });
      } else if (res.result === "duplicate") {
        setFeedback({ tone: "duplicate", message: res.message });
      } else {
        setFeedback({ tone: "invalid", message: res.message });
      }
    } catch {
      setFeedback({ tone: "invalid", message: "Something went wrong — try again." });
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const minutes = Math.floor(Math.max(timeLeft, 0) / 60);
  const seconds = Math.max(timeLeft, 0) % 60;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
          The Daily Ascent
        </p>
        {!accessibilityMode ? (
          <p
            className="font-serif-heading text-2xl tabular-nums text-indigo"
            role="timer"
            aria-live="off"
          >
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        ) : (
          <p className="text-sm text-stone-dark">Accessibility mode · untimed</p>
        )}
      </div>

      <h2 className="font-serif-heading text-2xl font-semibold text-ink">{challenge.prompt}</h2>

      <button
        type="button"
        onClick={() => setWhatCountsOpen((o) => !o)}
        aria-expanded={whatCountsOpen}
        className="w-fit text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4"
      >
        {whatCountsOpen ? "Hide" : "What counts?"}
      </button>
      {whatCountsOpen && (
        <p className="rounded-xl border border-stone/30 bg-white/50 p-4 text-sm text-stone-dark">
          {challenge.whatCounts}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="answer-input" className="sr-only">
          Type an answer
        </label>
        <input
          id="answer-input"
          ref={inputRef}
          type="text"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type an answer…"
          className="min-h-[3rem] flex-1 rounded-xl border border-stone/40 bg-white px-4 text-lg text-ink focus:border-indigo"
        />
        <button
          type="submit"
          disabled={submitting || !input.trim()}
          className="min-h-[3rem] rounded-xl bg-indigo px-5 font-medium text-parchment disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <p aria-live="polite" className="min-h-[1.5rem] text-sm font-medium">
        {feedback && (
          <span
            className={
              feedback.tone === "accepted"
                ? "text-olive"
                : feedback.tone === "duplicate"
                  ? "text-stone-dark"
                  : "text-indigo-dim"
            }
          >
            {feedback.message}
          </span>
        )}
      </p>

      <div className="flex items-center justify-between rounded-xl border border-gold-soft bg-white/60 px-4 py-3">
        <span className="text-sm text-stone-dark">Ascent score</span>
        <span className="font-serif-heading text-2xl font-semibold text-ink">{score}</span>
      </div>

      <ul className="flex flex-col gap-2">
        {found.map((entry, i) => (
          <li
            key={`${entry.canonicalAnswer}-${i}`}
            className="animate-rise-in flex items-center justify-between rounded-lg border border-stone/30 bg-white/70 px-4 py-2.5"
          >
            <span className="flex items-center gap-3">
              <span className="font-medium text-ink">{entry.canonicalAnswer}</span>
              <TierBadge tier={entry.tier} />
            </span>
            <span className="font-serif-heading text-lg text-gold">+{entry.score}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={finish}
        disabled={finishing}
        className="mt-auto w-full rounded-full border-2 border-indigo px-6 py-3 font-medium text-indigo transition-colors hover:bg-indigo hover:text-parchment disabled:opacity-50"
      >
        Finish
      </button>
    </div>
  );
}
