"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { TierBadge } from "./TierBadge";
import type {
  AnswerTier,
  BonusRoundStatus,
  DailySetSummary,
  SubmitBonusRoundAnswerResponse,
} from "@/lib/types";

type Feedback = { tone: "accepted" | "invalid"; message: string; tier?: AnswerTier; suggestion?: string };
type Stage = "offer" | "starting" | "playing" | "finishing";

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Optional second chance after the Scripture Bonus, before results are
// revealed: 5 minutes to go back over the same 5 questions, freely
// switching between whichever are still open, starting from whatever score
// the player already locked in during the main round. Its score is purely
// separate — it never touches ascent_score/total_score.
export function BonusRoundScreen({
  dailySet,
  sessionId,
  resumedStatus,
  onDone,
}: {
  dailySet: DailySetSummary;
  sessionId: string;
  resumedStatus?: BonusRoundStatus;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<Stage>(resumedStatus?.active ? "playing" : "offer");
  const [status, setStatus] = useState<BonusRoundStatus | null>(resumedStatus ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [whatCountsOpen, setWhatCountsOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const finishedRef = useRef(false);

  const lockedByChallenge = useMemo(
    () => new Map((status?.questions ?? []).map((q) => [q.challengeId, q])),
    [status]
  );
  const openQuestions = useMemo(
    () => dailySet.questions.filter((q) => !lockedByChallenge.get(q.id)?.locked),
    [dailySet.questions, lockedByChallenge]
  );
  // Falls back to the first still-open question whenever the explicitly
  // chosen one becomes locked (just answered correctly) or was never set —
  // derived directly from render state instead of synced via an effect.
  const activeQuestionId =
    activeId && !lockedByChallenge.get(activeId)?.locked ? activeId : (openQuestions[0]?.id ?? null);

  useEffect(() => {
    if (stage !== "playing") return;
    const id = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(id);
  }, [stage]);

  const endsAtMs = status?.endsAt ? new Date(status.endsAt).getTime() : null;
  const timeLeftMs = endsAtMs ? endsAtMs - nowMs : 0;

  const finish = async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setStage("finishing");
    try {
      await fetchJson(`/api/sessions/${sessionId}/bonus-round/finish`, { method: "POST" });
    } catch {
      // Non-fatal — the finish endpoint is idempotent and safe to skip here.
    }
    onDone();
  };

  useEffect(() => {
    if (stage === "playing" && endsAtMs !== null && timeLeftMs <= 0) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, timeLeftMs, endsAtMs]);

  const start = async () => {
    setStage("starting");
    try {
      const res = await fetchJson<BonusRoundStatus>(`/api/sessions/${sessionId}/bonus-round/start`, {
        method: "POST",
      });
      setStatus(res);
      setStage("playing");
    } catch {
      setStage("offer");
    }
  };

  const skip = () => onDone();

  const submit = async (rawInput: string) => {
    if (!activeQuestionId || !rawInput.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetchJson<SubmitBonusRoundAnswerResponse>(
        `/api/sessions/${sessionId}/bonus-round/questions/${activeQuestionId}/answer`,
        { method: "POST", body: JSON.stringify({ rawInput }) }
      );
      const answeredId = activeQuestionId;
      setStatus((s) =>
        s
          ? {
              ...s,
              currentScore: res.currentScore,
              questions: s.questions.map((q) =>
                q.challengeId === answeredId && res.result === "accepted"
                  ? {
                      ...q,
                      locked: true,
                      score: res.score,
                      canonicalAnswer: res.canonicalAnswer ?? null,
                      tier: res.tier ?? null,
                    }
                  : q
              ),
            }
          : s
      );

      if (res.result === "accepted") {
        setFeedback({ tone: "accepted", message: res.message, tier: res.tier });
        setInput("");
      } else {
        setFeedback({ tone: "invalid", message: res.message, suggestion: res.suggestion });
      }
    } catch {
      setFeedback({ tone: "invalid", message: "Something went wrong — try again." });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const switchTo = (challengeId: string) => {
    if (lockedByChallenge.get(challengeId)?.locked) return;
    setActiveId(challengeId);
    setInput("");
    setFeedback(null);
    setWhatCountsOpen(false);
  };

  if (stage === "offer") {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">Bonus Round</p>
        <div className="rounded-2xl border border-gold-soft bg-white/70 p-6">
          <p className="font-serif-heading text-2xl font-semibold text-ink">Want 5 more minutes?</p>
          <p className="mt-2 text-ink">
            Go back over today&apos;s questions and try to pick up any you missed — toggle between them
            freely and answer in any order. This score is separate from your Ascend score: it&apos;s its
            own shareable number with its own leaderboard, and starts from what you already got right.
          </p>
          <p className="mt-2 text-sm text-stone-dark">
            You can only play this before seeing your results — once you skip or the 5 minutes run out,
            it&apos;s locked in.
          </p>
        </div>
        <button
          type="button"
          onClick={start}
          className="w-full rounded-full bg-indigo px-6 py-4 text-lg font-medium text-parchment transition-colors hover:bg-indigo-dim"
        >
          Start the Bonus Round
        </button>
        <button
          type="button"
          onClick={skip}
          className="w-full rounded-full border-2 border-stone px-6 py-3 text-center font-medium text-stone-dark transition-colors hover:bg-white/60"
        >
          Skip — see my results
        </button>
      </div>
    );
  }

  if (stage === "starting" || stage === "finishing" || !status) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-stone-dark">{stage === "finishing" ? "Locking in your bonus score…" : "Starting…"}</p>
      </div>
    );
  }

  const activeQuestion = dailySet.questions.find((q) => q.id === activeQuestionId) ?? null;
  const allDone = openQuestions.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">Bonus Round</p>
        <p
          className={`font-serif-heading text-2xl tabular-nums ${timeLeftMs < 30000 ? "text-indigo-dim" : "text-indigo"}`}
          role="timer"
          aria-live="off"
        >
          {formatClock(timeLeftMs)}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gold-soft bg-white/60 px-4 py-3">
        <span className="text-sm text-stone-dark">Bonus score</span>
        <span className="font-serif-heading text-2xl font-semibold text-ink">{status.currentScore}</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {dailySet.questions.map((q) => {
          const s = lockedByChallenge.get(q.id);
          const active = q.id === activeQuestionId;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => switchTo(q.id)}
              disabled={s?.locked}
              aria-pressed={active}
              className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                s?.locked
                  ? "border-olive/40 bg-olive/10 text-olive"
                  : active
                    ? "border-indigo bg-indigo text-parchment"
                    : "border-stone/40 bg-white/60 text-ink hover:border-indigo"
              }`}
            >
              <span>Q{q.slot}</span>
              <span>{s?.locked ? "✓" : "—"}</span>
            </button>
          );
        })}
      </div>

      {allDone ? (
        <div className="rounded-2xl border border-olive/40 bg-white/70 p-6 text-center">
          <p className="font-serif-heading text-xl font-semibold text-olive">You got them all!</p>
          <p className="mt-2 text-stone-dark">Nothing left to try — lock in your bonus score whenever you&apos;re ready.</p>
        </div>
      ) : (
        activeQuestion && (
          <>
            <h2 className="font-serif-heading text-2xl font-semibold text-ink">{activeQuestion.prompt}</h2>

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
                {activeQuestion.whatCounts}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <label htmlFor="bonus-round-input" className="sr-only">
                Guess
              </label>
              <input
                id="bonus-round-input"
                type="text"
                autoFocus
                disabled={busy}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a guess…"
                className="min-h-[3rem] flex-1 rounded-xl border border-stone/40 bg-white px-4 text-lg text-ink focus:border-indigo disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="min-h-[3rem] rounded-xl bg-indigo px-5 font-medium text-parchment disabled:opacity-50"
              >
                Guess
              </button>
            </form>

            <div aria-live="polite" className="min-h-[3.5rem]">
              {feedback && (
                <div
                  className={`animate-rise-in flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
                    feedback.tone === "accepted" ? "border-olive bg-white/70" : "border-stone/30 bg-white/50"
                  }`}
                >
                  <span className={feedback.tone === "accepted" ? "font-medium text-olive" : "text-stone-dark"}>
                    {feedback.message}
                  </span>
                  {feedback.tone === "accepted" && feedback.tier && <TierBadge tier={feedback.tier} />}
                  {feedback.tone === "invalid" && feedback.suggestion && (
                    <button
                      type="button"
                      onClick={() => submit(feedback.suggestion!)}
                      disabled={busy}
                      className="rounded-full border border-indigo px-3 py-1 text-xs font-medium text-indigo hover:bg-indigo hover:text-parchment disabled:opacity-50"
                    >
                      Yes, that&apos;s what I meant
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )
      )}

      <button
        type="button"
        onClick={finish}
        className="mt-auto w-full rounded-full bg-indigo px-6 py-4 text-lg font-medium text-parchment transition-colors hover:bg-indigo-dim"
      >
        {allDone ? "See results" : "Lock in my bonus score now"}
      </button>
    </div>
  );
}
