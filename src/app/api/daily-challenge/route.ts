import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { DailyChallengeSummary } from "@/lib/types";

// Public-safe entry point for the landing screen: the prompt, rules, and
// the bonus verse text, but never the answer set or the bonus's correct book.
export async function GET() {
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);

  // Most recent published challenge on or before today; falls back to the
  // earliest published challenge so the app stays playable while content is
  // still thin (only a couple of seeded days so far).
  let { data: challenge } = await supabase
    .from("daily_challenges")
    .select("id, date, prompt, instructions, what_counts, duration_seconds, canon_scope, scripture_bonus_id, status")
    .eq("status", "published")
    .lte("date", today)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challenge) {
    const fallback = await supabase
      .from("daily_challenges")
      .select("id, date, prompt, instructions, what_counts, duration_seconds, canon_scope, scripture_bonus_id, status")
      .eq("status", "published")
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();
    challenge = fallback.data;
  }

  if (!challenge || !challenge.scripture_bonus_id) {
    return NextResponse.json({ error: "No published challenge available" }, { status: 404 });
  }

  const { data: bonus } = await supabase
    .from("scripture_bonus")
    .select("id, display_text")
    .eq("id", challenge.scripture_bonus_id)
    .single();

  if (!bonus) {
    return NextResponse.json({ error: "Challenge is missing its Scripture Bonus" }, { status: 500 });
  }

  const summary: DailyChallengeSummary = {
    id: challenge.id,
    date: challenge.date,
    prompt: challenge.prompt,
    instructions: challenge.instructions,
    whatCounts: challenge.what_counts,
    durationSeconds: challenge.duration_seconds,
    canonScope: challenge.canon_scope,
    scriptureBonus: {
      id: bonus.id,
      displayText: bonus.display_text,
    },
  };

  return NextResponse.json(summary);
}
