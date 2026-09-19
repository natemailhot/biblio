"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { IntroScreen } from "./IntroScreen";
import { AscentScreen } from "./AscentScreen";
import { BonusScreen } from "./BonusScreen";
import { ResultsScreen } from "./ResultsScreen";
import type { DailyChallengeSummary, SessionResults } from "@/lib/types";

type Phase = "loading" | "intro" | "ascent" | "bonus" | "results" | "error";

export function GameApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [challenge, setChallenge] = useState<DailyChallengeSummary | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchJson<DailyChallengeSummary>("/api/daily-challenge")
      .then((c) => {
        setChallenge(c);
        setPhase("intro");
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : "Could not load today's challenge.");
        setPhase("error");
      });
  }, []);

  const handleBegin = async (accessibility: boolean) => {
    if (!challenge) return;
    setAccessibilityMode(accessibility);
    try {
      const res = await fetchJson<{ sessionId: string }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          challengeId: challenge.id,
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

  const handleAscentFinished = () => setPhase("bonus");

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
        <p className="text-stone-dark">Loading today&apos;s Ascent…</p>
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

  if (phase === "intro" && challenge) {
    return <IntroScreen challenge={challenge} onBegin={handleBegin} />;
  }

  if (phase === "ascent" && challenge && sessionId) {
    return (
      <AscentScreen
        challenge={challenge}
        sessionId={sessionId}
        accessibilityMode={accessibilityMode}
        onFinished={handleAscentFinished}
      />
    );
  }

  if (phase === "bonus" && challenge && sessionId) {
    return <BonusScreen challenge={challenge} sessionId={sessionId} onDone={handleBonusDone} />;
  }

  if (phase === "results" && results && challenge) {
    return <ResultsScreen results={results} dateLabel={challenge.date} />;
  }

  return null;
}
