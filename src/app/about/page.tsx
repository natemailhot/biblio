import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";

export const metadata = {
  title: "About — Ascend",
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · About
      </p>
      <h1 className="font-serif-heading text-3xl font-semibold text-ink">About Ascend</h1>

      <div className="flex flex-col gap-4 text-ink">
        <p>
          Ascend is a daily game for people who want to know the Bible more deeply — one
          surprising answer at a time. Every day brings five questions, each with a full
          curated list of valid answers ranked from the obvious to the obscure. The rarer the
          answer you land on, the higher you climb — from the Outer Court toward the Third
          Heaven.
        </p>
        <p>
          Scores reflect how likely a player is to think of an answer immediately, not how
          important it is theologically — a well-known name can be worth 10 points while a
          single verse&apos;s worth of detail might be worth 100.
        </p>
        <p>
          A Scripture Bonus rounds out each day: guess the book, chapter, or verse a quoted
          passage comes from for a multiplier on your score.
        </p>
      </div>

      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
