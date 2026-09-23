"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { fetchJson } from "@/lib/fetchJson";
import type { QuestionAttempt } from "@/lib/types";

// Lets a player flag any one of their guesses on a question as something
// they believe should have counted — not just their last attempt. Shared
// between AscentScreen (right after a question, mid-round) and
// ResultsScreen (after the fact, from the full history).
export function ProtestPanel({
  sessionId,
  challengeId,
  attempts,
  slot,
}: {
  sessionId: string;
  challengeId: string;
  attempts: QuestionAttempt[];
  slot: number;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const distinctAttempts = attempts.filter(
    (a, i) => attempts.findIndex((b) => b.rawInput.trim().toLowerCase() === a.rawInput.trim().toLowerCase()) === i
  );

  if (distinctAttempts.length === 0) return null;

  const submit = async () => {
    if (!selectedId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetchJson(`/api/sessions/${sessionId}/questions/${challengeId}/protest`, {
        method: "POST",
        body: JSON.stringify({ submittedAnswerId: selectedId, playerNote: note.trim() || undefined }),
      });
      setSent(true);
      track("Answer Protested", { slot });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return <p className="text-xs text-olive">Thanks — that guess has been flagged for review.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-indigo underline decoration-gold-soft underline-offset-4"
      >
        Think one of your guesses should count? Protest →
      </button>
    );
  }

  return (
    <div className="animate-rise-in flex flex-col gap-2">
      <p className="text-xs text-stone-dark">Which guess?</p>
      <div className="flex flex-wrap gap-1.5">
        {distinctAttempts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelectedId(a.id)}
            aria-pressed={selectedId === a.id}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selectedId === a.id
                ? "border-indigo bg-indigo text-parchment"
                : "border-stone/40 bg-white/60 text-ink hover:border-indigo"
            }`}
          >
            {a.rawInput}
          </button>
        ))}
      </div>
      {selectedId && (
        <>
          <label htmlFor={`protest-note-${challengeId}`} className="text-xs text-stone-dark">
            Why should it count? (optional)
          </label>
          <textarea
            id={`protest-note-${challengeId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-stone/40 bg-white px-3 py-2 text-sm text-ink focus:border-indigo"
          />
          {error && <p className="text-xs text-indigo-dim">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="w-fit rounded-full border border-indigo px-3 py-1 text-xs font-medium text-indigo hover:bg-indigo hover:text-parchment disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Submit protest"}
          </button>
        </>
      )}
    </div>
  );
}
