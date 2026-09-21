"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { fetchJson } from "@/lib/fetchJson";

export default function SubmitQuestionPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetchJson("/api/questions/submit", { method: "POST", body: JSON.stringify({ message: message.trim() }) });
      setSent(true);
      setMessage("");
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Submit a Question
      </p>
      <h1 className="font-serif-heading text-3xl font-semibold text-ink">Submit a question</h1>
      <p className="text-stone-dark">
        Got an idea for a future day&apos;s question? Describe the prompt, and if you have any
        in mind, some answers that should count and roughly how rare they are.
      </p>

      {sent ? (
        <p className="rounded-2xl border border-gold-soft bg-white/60 p-5 text-olive">
          Thanks — your question idea was sent.
        </p>
      ) : (
        <>
          <label htmlFor="question-message" className="sr-only">
            Your question idea
          </label>
          <textarea
            id="question-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder={'e.g. "Name a judge of Israel" — Deborah (obvious), Ehud (less known), Tola (very obscure)'}
            className="w-full rounded-xl border border-stone/40 bg-white px-4 py-3 text-ink focus:border-indigo"
          />
          {error && <p className="text-sm text-indigo-dim">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="w-full rounded-full bg-indigo px-6 py-3 font-medium text-parchment disabled:opacity-50"
          >
            Submit question idea
          </button>
        </>
      )}

      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
