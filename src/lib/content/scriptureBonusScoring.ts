import type { ScriptureBonusLevel } from "@/lib/types";

// Fixed multipliers applied to the Ascent score based on how precisely the
// player guesses the bonus verse's location. They get exactly one guess at
// one self-chosen precision level — no retries, unlike the Ascent
// questions. Wrong or no guess leaves the score unchanged (1x).
export const BONUS_MULTIPLIERS: Record<ScriptureBonusLevel, number> = {
  testament: 1.1,
  book: 1.3,
  chapter: 1.5,
  verse: 2.0,
};

export const BONUS_LEVEL_LABELS: Record<ScriptureBonusLevel, string> = {
  testament: "Testament",
  book: "Book",
  chapter: "Book + Chapter",
  verse: "Book + Chapter + Verse",
};
