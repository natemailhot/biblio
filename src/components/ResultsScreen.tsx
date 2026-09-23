"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { BRAND_EMOJI, MISS_EMOJI, TIER_META } from "@/lib/content/tiers";
import { BONUS_LEVEL_LABELS } from "@/lib/content/scriptureBonusScoring";
import { fetchJson } from "@/lib/fetchJson";
import { TierBadge } from "./TierBadge";
import type { BonusRoundStatus, QuestionResult, RankedAnswer, SessionResults } from "@/lib/types";

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

function QuestionCard({ q, sessionId }: { q: QuestionResult; sessionId?: string }) {
  const hit = q.result === "accepted";
  const [open, setOpen] = useState(false);
  const [catholicOpen, setCatholicOpen] = useState(false);
  const [protestOpen, setProtestOpen] = useState(false);
  const [protestNote, setProtestNote] = useState("");
  const [protestSubmitting, setProtestSubmitting] = useState(false);
  const [protestSent, setProtestSent] = useState(false);
  const [protestError, setProtestError] = useState<string | null>(null);
  const mainAnswers = q.allAnswers.filter((a) => !a.isCatholicOnly);
  const catholicAnswers = q.allAnswers.filter((a) => a.isCatholicOnly);

  const submitProtest = async () => {
    if (!sessionId || protestSubmitting) return;
    setProtestSubmitting(true);
    setProtestError(null);
    try {
      await fetchJson(`/api/sessions/${sessionId}/questions/${q.challengeId}/protest`, {
        method: "POST",
        body: JSON.stringify({ playerNote: protestNote.trim() || undefined }),
      });
      setProtestSent(true);
      track("Answer Protested", { slot: q.slot });
    } catch {
      setProtestError("Something went wrong — try again.");
    } finally {
      setProtestSubmitting(false);
    }
  };

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
        <div className="mt-3 border-t border-stone/20 pt-3">
          <ul className="flex flex-col gap-1.5">
            {mainAnswers.map((a) => (
              <AnswerRow key={a.canonicalAnswer} a={a} />
            ))}
          </ul>

          {catholicAnswers.length > 0 && (
            <div className="mt-3 border-t border-stone/20 pt-3">
              <button
                type="button"
                onClick={() => setCatholicOpen((o) => !o)}
                aria-expanded={catholicOpen}
                className="text-xs font-medium text-indigo underline decoration-gold-soft underline-offset-4"
              >
                {catholicOpen ? "Hide" : "Show"} answers also accepted under the Catholic canon (
                {catholicAnswers.length})
              </button>
              {catholicOpen && (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {catholicAnswers.map((a) => (
                    <AnswerRow key={a.canonicalAnswer} a={a} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!hit && sessionId && (
        <div className="mt-3 border-t border-stone/20 pt-3">
          {protestSent ? (
            <p className="text-xs text-olive">Thanks — this question&apos;s been flagged for review.</p>
          ) : protestOpen ? (
            <div className="animate-rise-in flex flex-col gap-2">
              <label htmlFor={`protest-note-${q.slot}`} className="text-xs text-stone-dark">
                Why do you think &quot;{q.guess.trim() || "your answer"}&quot; should count? (optional)
              </label>
              <textarea
                id={`protest-note-${q.slot}`}
                value={protestNote}
                onChange={(e) => setProtestNote(e.target.value)}
                rows={2}
                maxLength={1000}
                className="w-full rounded-lg border border-stone/40 bg-white px-3 py-2 text-sm text-ink focus:border-indigo"
              />
              {protestError && <p className="text-xs text-indigo-dim">{protestError}</p>}
              <button
                type="button"
                onClick={submitProtest}
                disabled={protestSubmitting}
                className="w-fit rounded-full border border-indigo px-3 py-1 text-xs font-medium text-indigo hover:bg-indigo hover:text-parchment disabled:opacity-50"
              >
                {protestSubmitting ? "Sending…" : "Submit protest"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setProtestOpen(true)}
              className="text-xs font-medium text-indigo underline decoration-gold-soft underline-offset-4"
            >
              Think you got this one right? Protest this answer →
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export function ResultsScreen({
  results,
  returning = false,
  sessionId,
  dailySetId,
  onPlayBonusRound,
}: {
  results: SessionResults;
  returning?: boolean;
  sessionId?: string;
  dailySetId?: string;
  onPlayBonusRound?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [bonusRoundStatus, setBonusRoundStatus] = useState<BonusRoundStatus | null>(null);
  const [nextAscendIn, setNextAscendIn] = useState("00:00:00");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const ms = Math.max(0, nextMidnight.getTime() - now.getTime());
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1_000);
      setNextAscendIn(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const [bonusCopied, setBonusCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    fetchJson<BonusRoundStatus>(`/api/sessions/${sessionId}/bonus-round`)
      .then(setBonusRoundStatus)
      .catch(() => {});
  }, [sessionId]);

  const bonusRound = bonusRoundStatus?.completedAt ? bonusRoundStatus : null;
  // Normally the bonus round is only offered before results are revealed —
  // this dev-only reopening (see the button below) is a deliberate,
  // temporary exception so it can be tested by anyone, even after viewing
  // answers, without touching that rule for real players yet.
  const canOfferBonusRoundAnyway =
    !!onPlayBonusRound && !!sessionId && bonusRoundStatus !== null && !bonusRoundStatus.completedAt;

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
        track("Result Shared", { dayNumber: results.dayNumber, method: "native" });
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
      track("Result Shared", { dayNumber: results.dayNumber, method: "clipboard" });
    } catch {
      // clipboard may be unavailable; the card text is still visible below
    }
  };

  const bonusShareCard = [
    `Ascend #${results.dayNumber} ${BRAND_EMOJI} · Bonus Round`,
    `${bonusRound?.finalScore ?? 0}`,
    "",
    "dailyascend.io",
  ].join("\n");

  const handleShareBonus = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: bonusShareCard });
        track("Bonus Round Shared", { dayNumber: results.dayNumber, method: "native" });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(bonusShareCard);
      setBonusCopied(true);
      setTimeout(() => setBonusCopied(false), 2500);
      track("Bonus Round Shared", { dayNumber: results.dayNumber, method: "clipboard" });
    } catch {
      // clipboard may be unavailable
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
      track("Feedback Provided", { dayNumber: results.dayNumber });
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

      <button
        type="button"
        onClick={handleShare}
        className="w-full rounded-full bg-indigo px-6 py-4 text-lg font-medium text-parchment transition-colors hover:bg-indigo-dim"
      >
        {copied ? "Copied to clipboard" : "Share Results"}
      </button>

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

      {bonusRound && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-5">
          <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">Bonus Round</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="font-serif-heading text-3xl font-semibold text-ink">{bonusRound.finalScore}</p>
              <p className="text-sm text-stone-dark">
                Separate from your Ascend score —{" "}
                <Link
                  href="/bonus-leaderboard"
                  onClick={() => track("Results Teaser Clicked", { dayNumber: results.dayNumber, destination: "bonus-leaderboard" })}
                  className="text-indigo underline decoration-gold-soft underline-offset-4"
                >
                  see the bonus leaderboard
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={handleShareBonus}
              className="rounded-full border-2 border-indigo px-4 py-2 text-sm font-medium text-indigo transition-colors hover:bg-indigo hover:text-parchment"
            >
              {bonusCopied ? "Copied" : "Share"}
            </button>
          </div>
        </div>
      )}

      {canOfferBonusRoundAnyway && (
        <div className="rounded-2xl border border-dashed border-stone px-5 py-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-stone">🛠 Dev feature</p>
          <p className="mt-1 text-sm text-stone-dark">
            Normally the Bonus Round is only offered before you see your results. For now it&apos;s open
            to everyone for testing, even after viewing answers.
          </p>
          <button
            type="button"
            onClick={() => {
              track("Bonus Round Dev Reentry Clicked", { dayNumber: results.dayNumber });
              onPlayBonusRound?.();
            }}
            className="mt-3 rounded-full border-2 border-stone-dark px-5 py-2 text-sm font-medium text-stone-dark transition-colors hover:bg-white/60"
          >
            Play the Bonus Round anyway
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-5 text-center">
          <p className="text-sm text-stone-dark">Next Ascend</p>
          <p className="font-serif-heading text-3xl font-semibold tabular-nums text-ink">{nextAscendIn}</p>
          <p className="mt-1 text-xs text-stone">Day {results.dayNumber + 1} drops at midnight, your time</p>
          <Link
            href="/archive"
            onClick={() => track("Results Teaser Clicked", { dayNumber: results.dayNumber, destination: "archive" })}
            className="mt-3 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4"
          >
            Browse the archive →
          </Link>
        </div>

        <div className="rounded-2xl border border-gold-soft bg-white/60 p-5">
          <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">Leaderboard</p>
          <p className="mt-1 font-serif-heading text-xl font-semibold text-ink">Where do you rank?</p>
          <p className="mt-1 text-sm text-stone-dark">
            Today&apos;s top climbers, this week&apos;s best averages, and the longest streaks.
          </p>
          <Link
            href="/leaderboard"
            onClick={() => track("Results Teaser Clicked", { dayNumber: results.dayNumber, destination: "leaderboard" })}
            className="mt-2 inline-block text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4"
          >
            See the leaderboard →
          </Link>
        </div>
      </div>

      <div>
        <h3 className="font-serif-heading text-lg font-semibold text-ink">Your climb</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {results.questionResults.map((q) => (
            <QuestionCard key={q.slot} q={q} sessionId={sessionId} />
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

      <button
        type="button"
        onClick={() => setReportOpen((o) => !o)}
        aria-expanded={reportOpen}
        className="w-full rounded-full border-2 border-stone px-6 py-3 text-center font-medium text-stone-dark transition-colors hover:bg-white/60"
      >
        Report a missing answer
      </button>

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
