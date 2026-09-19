"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { getCompletedSessionId, markSessionCompleted, clearCompletedSession } from "@/lib/completedSessions";
import { IntroScreen } from "./IntroScreen";
import { AscentScreen } from "./AscentScreen";
import { BonusScreen } from "./BonusScreen";
import { ResultsScreen } from "./ResultsScreen";
import type { DailySetSummary, SessionResults } from "@/lib/types";

type Phase = "loading" | "intro" | "ascent" | "bonus" | "results" | "error";

export function GameApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [dailySet, setDailySet] = useState<DailySetSummary | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [returning, setReturning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchJson<DailySetSummary>("/api/daily-set")
      .then(async (d) => {
        setDailySet(d);

        const completedSessionId = getCompletedSessionId(d.id);
        if (completedSessionId) {
          try {
            const res = await fetchJson<SessionResults>(`/api/sessions/${completedSessionId}/results`);
            setSessionId(completedSessionId);
            setResults(res);
            setReturning(true);
            setPhase("results");
            return;
          } catch {
            // Stale/invalid local record (e.g. content was reseeded) — fall
            // through to a normal fresh play-through.
            clearCompletedSession(d.id);
          }
        }

        setPhase("intro");
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : "Could not load today's Ascend.");
        setPhase("error");
      });
  }, []);

  const handleBegin = async () => {
    if (!dailySet) return;
    try {
      const res = await fetchJson<{ sessionId: string }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ dailySetId: dailySet.id, mode: "timed" }),
      });
      setSessionId(res.sessionId);
      setPhase("ascent");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not start the round.");
      setPhase("error");
    }
  };

  const handleAllAnswered = () => setPhase("bonus");

  const handleBonusDone = async () => {
    if (!sessionId || !dailySet) return;
    try {
      const res = await fetchJson<SessionResults>(`/api/sessions/${sessionId}/results`);
      setResults(res);
      markSessionCompleted(dailySet.id, sessionId);
      setPhase("results");
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
    return <ResultsScreen results={results} returning={returning} />;
  }

  return null;
}
