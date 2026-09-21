import Link from "next/link";
import { BRAND_EMOJI } from "@/lib/content/tiers";

export const metadata = {
  title: "Privacy Policy — Ascend",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Privacy Policy
      </p>
      <h1 className="font-serif-heading text-3xl font-semibold text-ink">Privacy Policy</h1>
      <p className="text-sm text-stone">Last updated September 21, 2026.</p>

      <div className="flex flex-col gap-5 text-ink">
        <section>
          <h2 className="font-serif-heading text-lg font-semibold text-ink">Playing without an account</h2>
          <p className="mt-1 text-stone-dark">
            You can play Ascend without signing in. In that case we store a random, anonymous device
            identifier in a cookie on your browser — it isn&apos;t linked to your name, email, or any
            other personal information, and it exists only to stop the same device from completing a
            day more than once.
          </p>
        </section>

        <section>
          <h2 className="font-serif-heading text-lg font-semibold text-ink">Signing in with Google</h2>
          <p className="mt-1 text-stone-dark">
            If you choose to sign in, we use Google to authenticate you and receive your email address
            from Google for that purpose. You then choose a public username, which is the only identity
            shown to other players — your email address and Google profile are never displayed publicly
            or shared with other players.
          </p>
        </section>

        <section>
          <h2 className="font-serif-heading text-lg font-semibold text-ink">What we store</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-stone-dark">
            <li>Your email address and Google account ID (only if you sign in), used solely to authenticate you.</li>
            <li>Your chosen username, shown on the public leaderboard.</li>
            <li>Your daily game results — scores, guesses, and completion history — used to compute your stats and leaderboard rank.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif-heading text-lg font-semibold text-ink">Who we share data with</h2>
          <p className="mt-1 text-stone-dark">
            We don&apos;t sell or share your data with advertisers or other third parties. We use{" "}
            <span className="font-medium">Supabase</span> to store data and handle authentication, and{" "}
            <span className="font-medium">Vercel</span> to host the app and for basic, aggregate,
            privacy-friendly usage analytics (page views and feature usage — not tied to your identity).
          </p>
        </section>

        <section>
          <h2 className="font-serif-heading text-lg font-semibold text-ink">Your choices</h2>
          <p className="mt-1 text-stone-dark">
            You can sign out at any time from the account menu. To delete your account and all
            associated data, email us at the address below and we&apos;ll remove it.
          </p>
        </section>

        <section>
          <h2 className="font-serif-heading text-lg font-semibold text-ink">Contact</h2>
          <p className="mt-1 text-stone-dark">
            Questions about this policy or your data? Reach out at{" "}
            <a href="mailto:natopotatooo@gmail.com" className="text-indigo underline decoration-gold-soft underline-offset-4">
              natopotatooo@gmail.com
            </a>
            .
          </p>
        </section>
      </div>

      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
