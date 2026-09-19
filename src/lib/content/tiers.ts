import type { AnswerTier } from "@/lib/types";

// Ascent theming for the four score tiers: each stop is closer to God's
// presence, following the tabernacle's own ascending structure and closing
// with Paul's "third heaven" (2 Corinthians 12:2) for the rarest answers.
// Icon + label carry the meaning so tier distinctions never rely on color
// alone.
export const TIER_META: Record<
  AnswerTier,
  { label: string; icon: string; description: string; colorClass: string }
> = {
  familiar: {
    label: "Outer Court",
    icon: "△", // triangle outline
    description: "A well-known first step",
    colorClass: "tier-familiar",
  },
  known: {
    label: "Holy Place",
    icon: "▲△", // two triangles
    description: "A solid, recognizable climb",
    colorClass: "tier-known",
  },
  "deep-cut": {
    label: "Beyond the Veil",
    icon: "▲▲△",
    description: "Less commonly recalled, clearly valid",
    colorClass: "tier-deep-cut",
  },
  "daily-gem": {
    label: "Third Heaven",
    icon: "✦", // four-pointed star
    description: "Surprising, memorable, textually well-supported",
    colorClass: "tier-daily-gem",
  },
};

export const TIER_ORDER: AnswerTier[] = ["familiar", "known", "deep-cut", "daily-gem"];
