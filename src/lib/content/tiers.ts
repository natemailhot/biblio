import type { AnswerTier } from "@/lib/types";

// Six fixed-point ascent stages, following the tabernacle's own path toward
// God's presence and closing with Paul's "third heaven" (2 Corinthians
// 12:2). Exactly one answer per challenge sits at Third Heaven / 100 points
// (the Daily Gem) — enforced by a DB constraint, not just convention. Icon +
// label carry the meaning so tier distinctions never rely on color alone.
export const TIER_META: Record<
  AnswerTier,
  { label: string; points: number; icon: string; description: string; colorClass: string }
> = {
  "outer-court": {
    label: "Outer Court",
    points: 10,
    icon: "△",
    description: "A well-known first step",
    colorClass: "tier-outer-court",
  },
  "bronze-altar": {
    label: "Bronze Altar",
    points: 20,
    icon: "▲△",
    description: "A solid, recognizable climb",
    colorClass: "tier-bronze-altar",
  },
  "holy-place": {
    label: "Holy Place",
    points: 30,
    icon: "▲▲△",
    description: "Further in, still well attested",
    colorClass: "tier-holy-place",
  },
  veil: {
    label: "Beyond the Veil",
    points: 60,
    icon: "▲▲▲△",
    description: "Less commonly recalled, clearly valid",
    colorClass: "tier-veil",
  },
  "holy-of-holies": {
    label: "Holy of Holies",
    points: 85,
    icon: "▲▲▲▲",
    description: "Rare and precise — few players find this",
    colorClass: "tier-holy-of-holies",
  },
  "third-heaven": {
    label: "Third Heaven",
    points: 100,
    icon: "✦",
    description: "The single most surprising, best-supported answer today",
    colorClass: "tier-third-heaven",
  },
};

export const TIER_ORDER: AnswerTier[] = [
  "outer-court",
  "bronze-altar",
  "holy-place",
  "veil",
  "holy-of-holies",
  "third-heaven",
];
