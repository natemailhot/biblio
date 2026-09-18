import { normalizeAnswer } from "./normalize";
import type { ChallengeAnswer } from "@/lib/types";

// Exact-match only: normalized input must equal the canonical answer's
// normalized form or one of its normalized aliases. Fuzzy "did you mean"
// suggestions are a later phase — per plan.md, fuzzy matching must never
// silently accept a weak match, so Phase 1 sticks to exact matching and
// treats anything else as invalid.
export function findMatchingAnswer(
  normalizedInput: string,
  answers: ChallengeAnswer[]
): ChallengeAnswer | undefined {
  return answers.find((answer) => {
    if (answer.normalizedAnswer === normalizedInput) return true;
    return answer.aliases.some((alias) => normalizeAnswer(alias) === normalizedInput);
  });
}

export { normalizeAnswer };
