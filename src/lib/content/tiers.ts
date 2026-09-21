import type { AnswerTier } from "@/lib/types";

// Six fixed-point ascent stages, following the tabernacle's own path toward
// God's presence and closing with Paul's "third heaven" (2 Corinthians
// 12:2). Third Heaven / 100 points (the Daily Gem) is an editorial judgment
// call per question, not a forced slot — a question may have zero, one, or
// a couple of answers that genuinely earn it, depending on whether anything
// stands out as the rarest/most-surprising correct answer. Icon + label
// carry the meaning in-app so tier distinctions never rely on color alone;
// `shareEmoji` is the distinct symbol used in the spoiler-free share grid
// (one tile per question).
export const TIER_META: Record<
  AnswerTier,
  { label: string; points: number; icon: string; shareEmoji: string; description: string; colorClass: string }
> = {
  "outer-court": {
    label: "Outer Court",
    points: 10,
    icon: "△",
    shareEmoji: "\u{1F33F}", // herb / olive branch
    description: "A well-known first step",
    colorClass: "tier-outer-court",
  },
  "bronze-altar": {
    label: "Bronze Altar",
    points: 20,
    icon: "▲△",
    shareEmoji: "\u{1F525}", // fire
    description: "A solid, recognizable climb",
    colorClass: "tier-bronze-altar",
  },
  "holy-place": {
    label: "Holy Place",
    points: 30,
    icon: "▲▲△",
    shareEmoji: "\u{1F56F}️", // candle
    description: "Further in, still well attested",
    colorClass: "tier-holy-place",
  },
  veil: {
    label: "Beyond the Veil",
    points: 60,
    icon: "▲▲▲△",
    shareEmoji: "\u{1F319}", // crescent moon, hidden/mysterious
    description: "Less commonly recalled, clearly valid",
    colorClass: "tier-veil",
  },
  "holy-of-holies": {
    label: "Holy of Holies",
    points: 85,
    icon: "▲▲▲▲",
    shareEmoji: "\u{1F451}", // crown, the high priest alone entered here
    description: "Rare and precise — few players find this",
    colorClass: "tier-holy-of-holies",
  },
  "third-heaven": {
    label: "Third Heaven",
    points: 100,
    icon: "✦",
    shareEmoji: "\u{1F31F}", // glowing star
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

// Used in the share grid when a question was missed or skipped.
export const MISS_EMOJI = "⬛"; // black square

// Site brand emoji, used next to the title in-app and in share cards.
export const BRAND_EMOJI = "\u{1FA9C}"; // ladder
