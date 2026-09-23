import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUserId } from "@/lib/adminAuth";
import { BRAND_EMOJI } from "@/lib/content/tiers";

export default async function AdminProtestsPage() {
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
  const { data: protests } = await supabase
    .from("answer_protests")
    .select("id, raw_input, player_note, diagnostic, status, created_at, challenge_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const challengeIds = [...new Set((protests ?? []).map((p) => p.challenge_id))];
  const { data: challenges } = challengeIds.length
    ? await supabase
        .from("daily_challenges")
        .select("id, slot, prompt, daily_set_id, daily_sets(day_number, date)")
        .in("id", challengeIds)
    : { data: [] };
  const challengeById = new Map((challenges ?? []).map((c) => [c.id, c]));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Admin
      </p>
      <div>
        <h1 className="font-serif-heading text-3xl font-semibold text-ink">Protested answers</h1>
        <p className="mt-1 text-stone-dark">
          Players flagging a question they believe they answered correctly, pre-triaged with a live
          matching diagnostic. Nothing here is auto-applied to scoring.
        </p>
      </div>

      {(!protests || protests.length === 0) && <p className="text-center text-stone-dark">No protests yet.</p>}

      <div className="flex flex-col gap-3">
        {(protests ?? []).map((p) => {
          const c = challengeById.get(p.challenge_id) as
            | { slot: number; prompt: string; daily_sets: { day_number: number; date: string } | null }
            | undefined;
          const diag = p.diagnostic as { exactMatch: string | null; fuzzySuggestion: string | null; semanticSuggestion: string | null } | null;
          const likelyReal = diag && (diag.exactMatch || diag.fuzzySuggestion || diag.semanticSuggestion);

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-4 ${
                likelyReal ? "border-gold bg-gold/10" : "border-stone/30 bg-white/60"
              } ${p.status === "reviewed" ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-stone">
                  {c?.daily_sets ? `Day ${c.daily_sets.day_number} · ${c.daily_sets.date}` : "Unknown day"} · Q
                  {c?.slot ?? "?"} · {p.status}
                </p>
                <p className="text-xs text-stone">{new Date(p.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-1 font-medium text-ink">{c?.prompt ?? "(prompt unavailable)"}</p>
              <p className="mt-1 text-sm text-stone-dark">
                Guessed: <span className="text-ink">&quot;{p.raw_input}&quot;</span>
              </p>
              {p.player_note && <p className="mt-1 text-sm italic text-stone-dark">&quot;{p.player_note}&quot;</p>}
              {diag && (
                <p className="mt-2 text-xs text-gold">
                  {diag.exactMatch && `Exact match found now: ${diag.exactMatch}`}
                  {!diag.exactMatch && diag.fuzzySuggestion && `Fuzzy near-miss: ${diag.fuzzySuggestion}`}
                  {!diag.exactMatch && !diag.fuzzySuggestion && diag.semanticSuggestion && `Semantic near-miss: ${diag.semanticSuggestion}`}
                  {!diag.exactMatch && !diag.fuzzySuggestion && !diag.semanticSuggestion && "No candidate match found — likely a genuinely wrong guess, or the answer set has a real gap."}
                </p>
              )}
              {c?.daily_sets && (
                <Link
                  href={`/admin/review/${c.daily_sets.date}`}
                  className="mt-2 inline-block text-xs font-medium text-indigo underline decoration-gold-soft underline-offset-4"
                >
                  Review that day&apos;s full answer set →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <Link href="/admin" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Admin home
      </Link>
    </div>
  );
}
