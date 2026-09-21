"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";
import { fetchJson } from "@/lib/fetchJson";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetchJson("/api/feedback", { method: "POST", body: JSON.stringify({ message: message.trim() }) });
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
        Ascend {BRAND_EMOJI} · Feedback
      </p>
      <h1 className="font-serif-heading text-3xl font-semibold text-ink">Feedback</h1>
      <p className="text-stone-dark">
        A bad reference, a missing answer, a bug — anything at all. This goes straight to the
        person building the game.
      </p>

      {sent ? (
        <p className="rounded-2xl border border-gold-soft bg-white/60 p-5 text-olive">
          Thanks — your feedback was sent.
        </p>
      ) : (
        <>
          <label htmlFor="feedback-message" className="sr-only">
            Your feedback
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-stone/40 bg-white px-4 py-3 text-ink focus:border-indigo"
          />
          {error && <p className="text-sm text-indigo-dim">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="w-full rounded-full bg-indigo px-6 py-3 font-medium text-parchment disabled:opacity-50"
          >
            Send feedback
          </button>
        </>
      )}

      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
