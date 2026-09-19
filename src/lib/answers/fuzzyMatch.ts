import { normalizeAnswer } from "./normalize";
import type { ChallengeAnswer } from "@/lib/types";

// Optimal String Alignment distance: Levenshtein (insert/delete/substitute)
// plus adjacent-character transposition as a single edit. Transposed
// letters ("Sinia" for "Sinai") are by far the most common typo shape, and
// plain Levenshtein charges 2 for them — enough to miss real near-misses
// under a tight threshold.
function osaDistance(a: string, b: string): number {
  if (a === b) return 0;
  const d: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

// Suggests a "did you mean X?" answer when a guess is close-but-not-exact —
// never used to silently accept a weak match. Only proposes a suggestion
// when there's a single unambiguous closest candidate within a length-
// proportional edit-distance threshold (min 1, ~30% of the candidate's
// length), so short answers still require near-exact typing.
export function findFuzzySuggestion(
  normalizedInput: string,
  answers: ChallengeAnswer[]
): string | null {
  if (normalizedInput.length < 3) return null;

  let best: { canonicalAnswer: string; distance: number } | null = null;
  let tie = false;

  for (const answer of answers) {
    const candidates = [answer.normalizedAnswer, ...answer.aliases.map(normalizeAnswer)];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const distance = osaDistance(normalizedInput, candidate);
      if (distance === 0) continue; // exact matches are handled elsewhere
      const threshold = Math.max(1, Math.round(candidate.length * 0.3));
      if (distance > threshold) continue;

      if (!best || distance < best.distance) {
        best = { canonicalAnswer: answer.canonicalAnswer, distance };
        tie = false;
      } else if (distance === best.distance && answer.canonicalAnswer !== best.canonicalAnswer) {
        tie = true;
      }
    }
  }

  if (!best || tie) return null;
  return best.canonicalAnswer;
}
