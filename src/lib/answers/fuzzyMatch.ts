import { normalizeAnswer } from "./normalize";
import type { ChallengeAnswer } from "@/lib/types";

// Optimal String Alignment distance: Levenshtein (insert/delete/substitute)
// plus adjacent-character transposition as a single edit. Transposed
// letters ("Sinia" for "Sinai") are by far the most common typo shape, and
// plain Levenshtein charges 2 for them — enough to miss real near-misses
// under a tight threshold.
export function osaDistance(a: string, b: string): number {
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

// How many edits a guess is allowed to be from a candidate and still count
// as "the same word, typo'd" rather than "a different word that happens to
// be close." Stepped by candidate length rather than a flat percentage —
// a length-proportional threshold (the original approach: ~30% of length)
// let short candidates absorb 2 edits, which is enough to turn one real
// name into a completely different one ("Jonah" -> "Judah", "Mark" ->
// "Barak" were both real false-positive suggestions at that threshold).
// Real single-character typos dominate in practice, so short/medium
// answers only tolerate 1; length has to clear real thresholds before a
// second (or third) edit is allowed.
export function fuzzyThreshold(candidateLength: number): number {
  if (candidateLength < 8) return 1;
  if (candidateLength < 14) return 2;
  return 3;
}

// Suggests a "did you mean X?" answer when a guess is close-but-not-exact —
// never used to silently accept a weak match. Only proposes a suggestion
// when there's a single unambiguous closest candidate within the
// length-stepped edit-distance threshold above.
export function findFuzzySuggestion(
  normalizedInput: string,
  answers: ChallengeAnswer[]
): string | null {
  if (normalizedInput.length < 3) return null;

  let best: { canonicalAnswer: string; distance: number } | null = null;
  let tie = false;

  for (const answer of answers) {
    // A curated list of guesses that look close but are actually a
    // different (usually related but wrong) answer — e.g. "Abraham" is
    // excluded from "The Abrahamic Covenant" so naming the person doesn't
    // get offered as "did you mean the covenant?"
    if (answer.exclusions.some((e) => normalizeAnswer(e) === normalizedInput)) continue;

    const candidates = [answer.normalizedAnswer, ...answer.aliases.map(normalizeAnswer)];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const distance = osaDistance(normalizedInput, candidate);
      if (distance === 0) continue; // exact matches are handled elsewhere
      const threshold = fuzzyThreshold(candidate.length);
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

// Single-target version for cases with exactly one correct answer (e.g. the
// Scripture Bonus book name) rather than a whole answer set. Returns true
// if the input is a close-but-not-exact typo of any candidate, using the
// same distance/threshold rule as findFuzzySuggestion.
export function isCloseTypo(normalizedInput: string, candidates: string[]): boolean {
  if (normalizedInput.length < 3) return false;

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeAnswer(candidate);
    if (!normalizedCandidate) continue;
    const distance = osaDistance(normalizedInput, normalizedCandidate);
    if (distance === 0) continue; // exact matches are handled elsewhere
    if (distance <= fuzzyThreshold(normalizedCandidate.length)) return true;
  }
  return false;
}
