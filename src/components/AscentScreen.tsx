"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { TierBadge } from "./TierBadge";
import type { AnswerTier, DailyQuestionSummary, DailySetSummary, SubmitQuestionAnswerResponse } from "@/lib/types";

type Feedback = {
  tone: "accepted" | "invalid";
  message: string;
  tier?: AnswerTier;
};

const REVEAL_PAUSE_MS = 1400;

// Keyed by question.id in the parent so switching questions remounts this
// component with fresh state, rather than resetting state inside an effect.
function QuestionRound({
  question,
  index,
  total,
  sessionId,
  accessibilityMode,
  scoreSoFar,
  onAdvance,
}: {
  question: DailyQuestionSummary;
  index: number;
  total: number;
  sessionId: string;
  accessibilityMode: boolean;
  scoreSoFar: number;
  onAdvance: (scoreDelta: number) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(question.durationSeconds);
  const [input, setInput] = useState("");
  const [whatCountsOpen, setWhatCountsOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [finalReveal, setFinalReveal] = useState<Feedback | null>(null);
  const [triedGuesses, setTriedGuesses] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const lockedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJson(`/api/sessions/${sessionId}/questions/${question.id}/start`, { method: "POST" }).catch(
      () => {}
    );
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (rawInput: string, isTimeout: boolean) => {
    if (lockedRef.current) return;
    setBusy(true);
    let scoreDelta = 0;
    try {
      const res = await fetchJson<SubmitQuestionAnswerResponse>(
        `/api/sessions/${sessionId}/questions/${question.id}/answer`,
        { method: "POST", body: JSON.stringify({ rawInput }) }
      );

      if (res.result === "accepted") {
        lockedRef.current = true;
        scoreDelta = res.score;
        setFinalReveal({ tone: "accepted", message: res.message, tier: res.tier });
        setTimeout(() => onAdvance(scoreDelta), REVEAL_PAUSE_MS);
      } else if (isTimeout) {
        lockedRef.current = true;
        setFinalReveal({ tone: "invalid", message: "Time's up — no correct guess." });
        setTimeout(() => onAdvance(0), REVEAL_PAUSE_MS);
      } else {
        setTriedGuesses((g) => [...g, rawInput]);
        setFeedback({ tone: "invalid", message: res.message });
        setInput("");
        inputRef.current?.focus();
      }
    } catch {
      if (isTimeout) {
        lockedRef.current = true;
        setFinalReveal({ tone: "invalid", message: "Time's up — no correct guess." });
        setTimeout(() => onAdvance(0), REVEAL_PAUSE_MS);
      } else {
        setFeedback({ tone: "invalid", message: "Something went wrong — try again." });
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (accessibilityMode || finalReveal) return;
    if (timeLeft <= 0) {
      const id = setTimeout(() => submit("", true), 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, accessibilityMode, finalReveal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy || finalReveal) return;
    submit(input, false);
  };

  const minutes = Math.floor(Math.max(timeLeft, 0) / 60);
  const seconds = Math.max(timeLeft, 0) % 60;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
          Question {index + 1} of {total}
        </p>
        {!accessibilityMode ? (
          <p className="font-serif-heading text-2xl tabular-nums text-indigo" role="timer" aria-live="off">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        ) : (
          <p className="text-sm text-stone-dark">Accessibility mode · untimed</p>
        )}
      </div>

      <h2 className="font-serif-heading text-2xl font-semibold text-ink">{question.prompt}</h2>

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
          {question.whatCounts}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="answer-input" className="sr-only">
          Guess
        </label>
        <input
          id="answer-input"
          ref={inputRef}
          type="text"
          autoFocus
          disabled={busy || !!finalReveal}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a guess…"
          className="min-h-[3rem] flex-1 rounded-xl border border-stone/40 bg-white px-4 text-lg text-ink focus:border-indigo disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !!finalReveal || !input.trim()}
          className="min-h-[3rem] rounded-xl bg-indigo px-5 font-medium text-parchment disabled:opacity-50"
        >
          Guess
        </button>
      </form>

      <div aria-live="polite" className="min-h-[4rem]">
        {finalReveal ? (
          <div
            className={`animate-rise-in flex items-center justify-between rounded-xl border px-4 py-3 ${
              finalReveal.tone === "accepted" ? "border-olive bg-white/70" : "border-stone/30 bg-white/50"
            }`}
          >
            <span className={finalReveal.tone === "accepted" ? "font-medium text-olive" : "text-stone-dark"}>
              {finalReveal.message}
            </span>
            {finalReveal.tier && <TierBadge tier={finalReveal.tier} />}
          </div>
        ) : (
          feedback && (
            <p className="animate-rise-in text-sm font-medium text-indigo-dim">{feedback.message}</p>
          )
        )}
      </div>

      {triedGuesses.length > 0 && !finalReveal && (
        <p className="text-xs text-stone">Already tried: {triedGuesses.join(", ")}</p>
      )}

      <div className="mt-auto flex items-center justify-between rounded-xl border border-gold-soft bg-white/60 px-4 py-3">
        <span className="text-sm text-stone-dark">Ascent score</span>
        <span className="font-serif-heading text-2xl font-semibold text-ink">{scoreSoFar}</span>
      </div>
    </div>
  );
}

export function AscentScreen({
  dailySet,
  sessionId,
  accessibilityMode,
  onAllAnswered,
}: {
  dailySet: DailySetSummary;
  sessionId: string;
  accessibilityMode: boolean;
  onAllAnswered: () => void;
}) {
  const questions = dailySet.questions;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const handleAdvance = (scoreDelta: number) => {
    setScore((s) => s + scoreDelta);
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      onAllAnswered();
    }
  };

  return (
    <QuestionRound
      key={questions[index].id}
      question={questions[index]}
      index={index}
      total={questions.length}
      sessionId={sessionId}
      accessibilityMode={accessibilityMode}
      scoreSoFar={score}
      onAdvance={handleAdvance}
    />
  );
}
