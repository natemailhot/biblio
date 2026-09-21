import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUserId } from "@/lib/adminAuth";
import { BRAND_EMOJI, TIER_META } from "@/lib/content/tiers";
import type { AnswerTier } from "@/lib/types";

export default async function AdminReviewPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6 text-center">
        <p className="text-indigo-dim">
          Admin access required. Sign in with an approved Google account to continue.
        </p>
      </div>
    );
  }

  const supabase = createServiceRoleClient();
  const { data: dailySet } = await supabase
    .from("daily_sets")
    .select("id, day_number, date, status, scripture_bonus_id")
    .eq("date", date)
    .maybeSingle();

  if (!dailySet) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6 text-center">
        <p className="text-indigo-dim">No daily set found for {date}.</p>
      </div>
    );
  }

  const [{ data: challenges }, { data: bonus }] = await Promise.all([
    supabase
      .from("daily_challenges")
      .select("id, slot, prompt, instructions, what_counts, answer_set_version")
      .eq("daily_set_id", dailySet.id)
      .order("slot", { ascending: true }),
    dailySet.scripture_bonus_id
      ? supabase
          .from("scripture_bonus")
          .select("display_text, book, chapter, verse_start, verse_end, reference_display, context_note, translation")
          .eq("id", dailySet.scripture_bonus_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const challengeIds = (challenges ?? []).map((c) => c.id);
  const { data: answers } = await supabase
    .from("challenge_answers")
    .select(
      "challenge_id, answer_set_version, canonical_answer, aliases, score, tier, explanation, references, inclusion_notes, exclusions, active, is_catholic_only"
    )
    .in("challenge_id", challengeIds)
    .order("score", { ascending: false });

  const answersByChallenge = new Map<string, NonNullable<typeof answers>>();
  for (const a of answers ?? []) {
    if (!a.active) continue;
    const list = answersByChallenge.get(a.challenge_id) ?? [];
    list.push(a);
    answersByChallenge.set(a.challenge_id, list);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Admin Review
      </p>
      <div>
        <h1 className="font-serif-heading text-3xl font-semibold text-ink">
          Day {dailySet.day_number} · {dailySet.date}
        </h1>
        <p className="mt-1 text-stone-dark capitalize">Status: {dailySet.status}</p>
      </div>

      {(challenges ?? []).map((c) => {
        const answerRows = answersByChallenge.get(c.id) ?? [];
        return (
          <div key={c.id} className="rounded-2xl border border-gold-soft bg-white/60 p-5">
            <p className="text-xs uppercase tracking-wide text-stone">
              Question {c.slot} · {answerRows.length} answer{answerRows.length === 1 ? "" : "s"} · v
              {c.answer_set_version}
            </p>
            <p className="mt-1 font-serif-heading text-xl font-semibold text-ink">{c.prompt}</p>
            <p className="mt-1 text-sm text-stone-dark">{c.what_counts}</p>

            <ul className="mt-3 flex flex-col gap-2 border-t border-stone/20 pt-3">
              {answerRows.map((a, i) => {
                const tier = a.tier as AnswerTier;
                return (
                  <li key={`${a.canonical_answer}-${i}`} className="rounded-lg bg-white/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-ink">
                        {a.canonical_answer}
                        {a.is_catholic_only && <span className="ml-1.5 text-xs text-stone">(Catholic canon)</span>}
                      </span>
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-stone">{TIER_META[tier]?.label ?? a.tier}</span>
                        <span className="font-serif-heading font-semibold text-gold">{a.score}</span>
                      </span>
                    </div>
                    {a.aliases && a.aliases.length > 0 && (
                      <p className="mt-1 text-xs text-stone">Aliases: {a.aliases.join(", ")}</p>
                    )}
                    <p className="mt-1 text-xs text-stone-dark">{a.explanation}</p>
                    {Array.isArray(a.references) && a.references.length > 0 && (
                      <p className="mt-1 text-xs text-stone">
                        {(a.references as { display: string }[]).map((r) => r.display).join(" · ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {bonus && (
        <div className="rounded-2xl border border-gold-soft bg-white/60 p-5">
          <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">Scripture Bonus</p>
          <p className="mt-1 font-serif-heading text-xl font-semibold text-ink">
            {bonus.book} · {bonus.reference_display}
          </p>
          <p className="mt-2 text-ink">“{bonus.display_text}”</p>
          <p className="mt-2 text-sm text-stone-dark">{bonus.context_note}</p>
          <p className="mt-1 text-xs text-stone">{bonus.translation}</p>
        </div>
      )}

      <Link
        href={`/admin/day/${dailySet.date}`}
        className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4"
      >
        Preview-play this day →
      </Link>
      <Link href="/admin" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← All upcoming days
      </Link>
    </div>
  );
}
