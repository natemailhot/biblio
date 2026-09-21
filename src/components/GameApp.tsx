"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { fetchJson } from "@/lib/fetchJson";
import { getCompletedSessionId, markSessionCompleted, clearCompletedSession } from "@/lib/completedSessions";
import { IntroScreen } from "./IntroScreen";
import { AscentScreen } from "./AscentScreen";
import { BonusScreen } from "./BonusScreen";
import { ResultsScreen } from "./ResultsScreen";
import type { DailySetSummary, SessionResults } from "@/lib/types";

type Phase = "loading" | "intro" | "ascent" | "bonus" | "results" | "error";

// `date` lets the archive page replay a past day through the exact same
// flow as today's game — omit it (the normal path) to use the player's
// own local calendar date.
export function GameApp({ date }: { date?: string } = {}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [dailySet, setDailySet] = useState<DailySetSummary | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [returning, setReturning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // en-CA formats as YYYY-MM-DD; omitting timeZone uses the browser's
    // own local timezone, so the day rolls over at each player's midnight.
    const targetDate = date ?? new Date().toLocaleDateString("en-CA");
    fetchJson<DailySetSummary>(`/api/daily-set?date=${targetDate}`)
      .then(async (d) => {
        setDailySet(d);

        const showResults = async (completedSessionId: string) => {
          const res = await fetchJson<SessionResults>(`/api/sessions/${completedSessionId}/results`);
          setSessionId(completedSessionId);
          setResults(res);
          setReturning(true);
          setPhase("results");
          markSessionCompleted(d.id, completedSessionId);
          track("Returning Player Viewed Results", { dayNumber: d.dayNumber });
          // No-op if signed out or already linked — see the route for why
          // this is safer than guessing which session is "theirs" from
          // timing.
          fetchJson(`/api/sessions/${completedSessionId}/link`, { method: "POST" }).catch(() => {});
        };

        const localCompletedId = getCompletedSessionId(d.id);
        if (localCompletedId) {
          try {
            await showResults(localCompletedId);
            return;
          } catch {
            // Stale/invalid local record (e.g. content was reseeded) — fall
            // through to check the server before giving up on it entirely.
            clearCompletedSession(d.id);
          }
        }

        // localStorage doesn't know about it on this browser/device, but
        // the identity (signed-in account, or this device's anon cookie)
        // might already have finished it elsewhere — skip straight to
        // results instead of making the player click "Begin" only to be
        // told they already played.
        try {
          const { sessionId: serverCompletedId } = await fetchJson<{ sessionId: string | null }>(
            `/api/sessions/completed?dailySetId=${d.id}`
          );
          if (serverCompletedId) {
            await showResults(serverCompletedId);
            return;
          }
        } catch {
          // Non-fatal — just means we can't tell yet; fall through to intro.
        }

        setPhase("intro");
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : "Could not load today's Ascend.");
        setPhase("error");
      });
    // `date` is effectively fixed per mount: /day/[date] remounts this
    // component on route change, and the root page never passes it at all.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBegin = async () => {
    if (!dailySet) return;
    try {
      const res = await fetchJson<{ sessionId: string; alreadyCompleted: boolean }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ dailySetId: dailySet.id, mode: "timed" }),
      });
      setSessionId(res.sessionId);

      if (res.alreadyCompleted) {
        // This identity (account or anon device) already finished today,
        // just not on this browser's localStorage — go straight to
        // results instead of starting a round the server would reject.
        const results = await fetchJson<SessionResults>(`/api/sessions/${res.sessionId}/results`);
        setResults(results);
        markSessionCompleted(dailySet.id, res.sessionId);
        setReturning(true);
        setPhase("results");
        return;
      }

      setPhase("ascent");
      track("Ascent Started", { dayNumber: dailySet.dayNumber });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not start the round.");
      setPhase("error");
    }
  };

  const handleAllAnswered = () => {
    setPhase("bonus");
    if (dailySet) track("Ascent Completed", { dayNumber: dailySet.dayNumber });
  };

  const handleBonusDone = async () => {
    if (!sessionId || !dailySet) return;
    try {
      const res = await fetchJson<SessionResults>(`/api/sessions/${sessionId}/results`);
      setResults(res);
      markSessionCompleted(dailySet.id, sessionId);
      setPhase("results");
      track("Day Completed", { dayNumber: dailySet.dayNumber, totalScore: res.totalScore });
      fetchJson(`/api/sessions/${sessionId}/link`, { method: "POST" }).catch(() => {});
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not load results.");
      setPhase("error");
    }
  };

  if (phase === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-stone-dark">Loading today&apos;s Ascend…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-indigo-dim">{errorMessage}</p>
      </div>
    );
  }

  if (phase === "intro" && dailySet) {
    return <IntroScreen dailySet={dailySet} onBegin={handleBegin} />;
  }

  if (phase === "ascent" && dailySet && sessionId) {
    return (
      <AscentScreen dailySet={dailySet} sessionId={sessionId} onAllAnswered={handleAllAnswered} />
    );
  }

  if (phase === "bonus" && dailySet && sessionId) {
    return <BonusScreen dailySet={dailySet} sessionId={sessionId} onDone={handleBonusDone} />;
  }

  if (phase === "results" && results) {
    return (
      <ResultsScreen
        results={results}
        returning={returning}
        sessionId={sessionId ?? undefined}
        dailySetId={dailySet?.id}
      />
    );
  }

  return null;
}
