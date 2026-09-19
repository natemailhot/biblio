"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
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
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchJson<DailySetSummary>("/api/daily-set")
      .then((d) => {
        setDailySet(d);
        setPhase("intro");
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : "Could not load today's Ascend.");
        setPhase("error");
      });
  }, []);

  const handleBegin = async (accessibility: boolean) => {
    if (!dailySet) return;
    setAccessibilityMode(accessibility);
    try {
      const res = await fetchJson<{ sessionId: string }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          dailySetId: dailySet.id,
          mode: accessibility ? "accessibility" : "timed",
        }),
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
    if (!sessionId) return;
    try {
      const res = await fetchJson<SessionResults>(`/api/sessions/${sessionId}/results`);
      setResults(res);
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
      <AscentScreen
        dailySet={dailySet}
        sessionId={sessionId}
        accessibilityMode={accessibilityMode}
        onAllAnswered={handleAllAnswered}
      />
    );
  }

  if (phase === "bonus" && dailySet && sessionId) {
    return <BonusScreen dailySet={dailySet} sessionId={sessionId} onDone={handleBonusDone} />;
  }

  if (phase === "results" && results) {
    return <ResultsScreen results={results} />;
  }

  return null;
}
