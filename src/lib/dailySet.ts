import type { createServiceRoleClient } from "@/lib/supabase/server";
import type { DailySetSummary } from "@/lib/types";

// Shared by the public daily-set route and the admin preview route: builds
// the public-safe summary (prompts + bonus verse text, never an answer set)
// for a given daily_sets row.
export async function buildDailySetSummary(
  supabase: ReturnType<typeof createServiceRoleClient>,
  dailySet: { id: string; date: string; day_number: number; scripture_bonus_id: string | null }
): Promise<DailySetSummary | null> {
  if (!dailySet.scripture_bonus_id) return null;

  const [{ data: bonus }, { data: questions }] = await Promise.all([
    supabase
      .from("scripture_bonus")
      .select("id, display_text, canon_scope")
      .eq("id", dailySet.scripture_bonus_id)
      .single(),
    supabase
      .from("daily_challenges")
      .select("id, slot, prompt, instructions, what_counts, duration_seconds")
      .eq("daily_set_id", dailySet.id)
      .order("slot", { ascending: true }),
  ]);

  if (!bonus || !questions || questions.length === 0) return null;

  return {
    id: dailySet.id,
    dayNumber: dailySet.day_number,
    date: dailySet.date,
    questions: questions.map((q) => ({
      id: q.id,
      slot: q.slot,
      prompt: q.prompt,
      instructions: q.instructions,
      whatCounts: q.what_counts,
      durationSeconds: q.duration_seconds,
    })),
    scriptureBonus: {
      id: bonus.id,
      displayText: bonus.display_text,
      canonScope: bonus.canon_scope,
    },
  };
}
