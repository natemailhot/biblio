import type { ScriptureBonusGuessLevel, ScriptureBonusLevel } from "@/lib/types";

// Fixed multipliers applied to the Ascent score based on how precisely the
// player guesses the bonus verse's location. They get exactly one guess at
// one self-chosen precision level — no retries, unlike the Ascent
// questions. A wrong guess costs a penalty; explicitly choosing "I don't
// know" is neutral instead.
export const BONUS_MULTIPLIERS: Record<ScriptureBonusGuessLevel, number> = {
  testament: 1.1,
  book: 1.3,
  chapter: 1.5,
  verse: 2.0,
};

export const BONUS_INCORRECT_MULTIPLIER = 0.75;
export const BONUS_SKIP_MULTIPLIER = 1.0;

export const BONUS_LEVEL_LABELS: Record<ScriptureBonusLevel, string> = {
  testament: "Testament",
  book: "Book",
  chapter: "Book + Chapter",
  verse: "Book + Chapter + Verse",
  skip: "I don't know",
};
