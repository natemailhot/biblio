"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { fetchJson } from "@/lib/fetchJson";
import { TierBadge } from "./TierBadge";
import type {
  AnswerTier,
  BonusRoundAnswerResult,
  BonusRoundStatus,
  DailySetSummary,
  SubmitBonusRoundAnswerResponse,
} from "@/lib/types";

type Feedback = { tone: BonusRoundAnswerResult; message: string; tier?: AnswerTier; suggestion?: string };
type Stage = "offer" | "starting" | "playing" | "finishing";

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Optional second chance after the Scripture Bonus, before results are
// revealed: 5 minutes to go back over the same 5 questions, freely
// switching between them, trying to rack up as many distinct correct
// answers as possible — every question accepts unlimited answers, the goal
// being the highest cumulative sum, starting from whatever the player
// already got right in the main round. Its score is purely separate — it
// never touches ascent_score/total_score.
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

  const questionByChallenge = useMemo(
    () => new Map((status?.questions ?? []).map((q) => [q.challengeId, q])),
    [status]
  );
  const activeQuestionId = activeId ?? dailySet.questions[0]?.id ?? null;
  const activeQuestion = dailySet.questions.find((q) => q.id === activeQuestionId) ?? null;
  const activeFound = questionByChallenge.get(activeQuestionId ?? "")?.found ?? [];

  const totalFound = (status?.questions ?? []).reduce((sum, q) => sum + q.found.length, 0);

  useEffect(() => {
    if (stage !== "playing") return;
    const id = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage === "offer") track("Bonus Round Offered", { dayNumber: dailySet.dayNumber });
    // Fires once for the initial offer screen only, not on every stage change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endsAtMs = status?.endsAt ? new Date(status.endsAt).getTime() : null;
  const timeLeftMs = endsAtMs ? endsAtMs - nowMs : 0;

  const finish = async (reason: "manual" | "timeout") => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setStage("finishing");
    try {
      await fetchJson(`/api/sessions/${sessionId}/bonus-round/finish`, { method: "POST" });
    } catch {
      // Non-fatal — the finish endpoint is idempotent and safe to skip here.
    }
    track("Bonus Round Finished", { dayNumber: dailySet.dayNumber, reason, score: status?.currentScore ?? 0, totalFound });
    onDone();
  };

  useEffect(() => {
    if (stage === "playing" && endsAtMs !== null && timeLeftMs <= 0) {
      finish("timeout");
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
      track("Bonus Round Started", { dayNumber: dailySet.dayNumber, baselineScore: res.baselineScore });
    } catch {
      setStage("offer");
    }
  };

  const skip = () => {
    track("Bonus Round Skipped", { dayNumber: dailySet.dayNumber });
    onDone();
  };

  const submit = async (rawInput: string) => {
    if (!activeQuestionId || !rawInput.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetchJson<SubmitBonusRoundAnswerResponse>(
        `/api/sessions/${sessionId}/bonus-round/questions/${activeQuestionId}/answer`,
        { method: "POST", body: JSON.stringify({ rawInput }) }
      );
      const answeredId = activeQuestionId;
      track("Bonus Round Answer Submitted", { dayNumber: dailySet.dayNumber, result: res.result });

      if (res.result === "accepted") {
        setStatus((s) =>
          s
            ? {
                ...s,
                currentScore: res.currentScore,
                questions: s.questions.map((q) =>
                  q.challengeId === answeredId
                    ? {
                        ...q,
                        found: [
                          ...q.found,
                          {
                            answerId: `pending-${Date.now()}`,
                            canonicalAnswer: res.canonicalAnswer ?? "",
                            score: res.score,
                            tier: res.tier ?? "outer-court",
                            source: "bonus" as const,
                          },
                        ],
                      }
                    : q
                ),
              }
            : s
        );
        setFeedback({ tone: "accepted", message: res.message, tier: res.tier });
        setInput("");
      } else {
        setFeedback({ tone: res.result, message: res.message, suggestion: res.suggestion });
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
            Go back over today&apos;s questions and rack up as many correct answers as you can — each
            question takes unlimited guesses, so the goal is the highest total, not just one right answer
            per question. Toggle between them freely. This score is separate from your Ascend score: it&apos;s
            its own shareable number with its own leaderboard, and starts from what you already got right.
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
        <span className="text-sm text-stone-dark">Bonus score · {totalFound} found</span>
        <span className="font-serif-heading text-2xl font-semibold text-ink">{status.currentScore}</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {dailySet.questions.map((q) => {
          const s = questionByChallenge.get(q.id);
          const active = q.id === activeQuestionId;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => switchTo(q.id)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                active
                  ? "border-indigo bg-indigo text-parchment"
                  : (s?.found.length ?? 0) > 0
                    ? "border-olive/40 bg-olive/10 text-olive"
                    : "border-stone/40 bg-white/60 text-ink hover:border-indigo"
              }`}
            >
              <span>Q{q.slot}</span>
              <span>{s?.found.length ?? 0}</span>
            </button>
          );
        })}
      </div>

      {activeQuestion && (
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
              placeholder="Type another guess…"
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
                  feedback.tone === "accepted"
                    ? "border-olive bg-white/70"
                    : feedback.tone === "duplicate"
                      ? "border-gold-soft bg-white/70"
                      : "border-stone/30 bg-white/50"
                }`}
              >
                <span
                  className={
                    feedback.tone === "accepted"
                      ? "font-medium text-olive"
                      : feedback.tone === "duplicate"
                        ? "font-medium text-gold"
                        : "text-stone-dark"
                  }
                >
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

          {activeFound.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-stone">Found so far</p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {activeFound.map((a, i) => (
                  <li
                    key={`${a.answerId}-${i}`}
                    className="flex items-center justify-between rounded-lg bg-olive/10 px-3 py-1.5 text-sm"
                  >
                    <span className="text-ink">
                      {a.canonicalAnswer}
                      {a.source === "main" && <span className="ml-1.5 text-xs text-stone">(main round)</span>}
                    </span>
                    <span className="font-serif-heading text-gold">{a.score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => finish("manual")}
        className="mt-auto w-full rounded-full bg-indigo px-6 py-4 text-lg font-medium text-parchment transition-colors hover:bg-indigo-dim"
      >
        Lock in my bonus score now
      </button>
    </div>
  );
}
