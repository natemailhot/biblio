import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminUserId } from "@/lib/adminAuth";
import { BRAND_EMOJI } from "@/lib/content/tiers";

export default async function AdminPage() {
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
  const today = new Date().toLocaleDateString("en-CA");
  const { data: upcoming } = await supabase
    .from("daily_sets")
    .select("id, day_number, date, status")
    .gte("date", today)
    .order("date", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="font-serif-heading text-sm uppercase tracking-[0.2em] text-gold">
        Ascend {BRAND_EMOJI} · Admin
      </p>
      <div>
        <h1 className="font-serif-heading text-3xl font-semibold text-ink">Upcoming days</h1>
        <p className="mt-1 text-stone-dark">Preview-play or review answers for today and days not yet live.</p>
      </div>

      {(!upcoming || upcoming.length === 0) && (
        <p className="text-center text-stone-dark">Nothing scheduled yet.</p>
      )}

      {upcoming && upcoming.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gold-soft bg-white/60">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stone/20 text-xs uppercase tracking-wide text-stone">
                <th scope="col" className="px-4 py-2.5 font-medium">No.</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Date</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((d) => (
                <tr key={d.id} className="border-b border-stone/10 last:border-0">
                  <td className="px-4 py-3 font-serif-heading tabular-nums text-stone-dark">
                    {String(d.day_number).padStart(3, "0")}
                  </td>
                  <td className="px-4 py-3 text-ink">{d.date}</td>
                  <td className="px-4 py-3 text-sm text-stone-dark capitalize">{d.status}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Link
                      href={`/admin/review/${d.date}`}
                      className="mr-3 text-indigo underline decoration-gold-soft underline-offset-4"
                    >
                      Review
                    </Link>
                    <Link
                      href={`/admin/day/${d.date}`}
                      className="text-indigo underline decoration-gold-soft underline-offset-4"
                    >
                      Preview play →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/" className="text-center text-sm font-medium text-indigo underline decoration-gold-soft underline-offset-4">
        ← Back to today&apos;s Ascend
      </Link>
    </div>
  );
}
