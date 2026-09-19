import { TIER_META } from "@/lib/content/tiers";
import type { AnswerTier } from "@/lib/types";

export function TierBadge({ tier }: { tier: AnswerTier }) {
  const meta = TIER_META[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.colorClass}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
}
