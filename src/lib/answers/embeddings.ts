import { embed, embedMany, cosineSimilarity } from "ai";
import type { ChallengeAnswer } from "@/lib/types";

// Fast free-tier model (~300-450ms per call) that we've verified gives the
// correct top-1 candidate on adversarial same-question paraphrases, as long
// as it's embedding a rich fingerprint rather than the bare canonical name
// (see backfillEmbeddings.ts). The higher-quality qwen3 8b model discriminates
// even better but takes 8-12s per call — too slow to sit inside the
// question timer, so we stick with a model fast enough for the live path.
export const EMBEDDING_MODEL = "google/text-embedding-005";

// A guess must beat this floor to be offered as a "did you mean?" at all,
// and must beat the runner-up candidate by this margin so a genuinely
// ambiguous guess (could plausibly be either of two answers) doesn't
// silently pick one. Both thresholds are a starting point — tune against
// real misses once this ships.
const MIN_SIMILARITY = 0.55;
const MIN_MARGIN = 0.05;

export function buildFingerprint(canonical: string, aliases: string[], explanation: string): string {
  return [canonical, ...aliases, explanation].join(". ");
}

export async function embedFingerprint(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: text });
  return embedding;
}

export async function embedFingerprints(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: texts });
  return embeddings;
}

// Best-effort semantic fallback for a guess that matched no exact
// answer/alias and no close typo. Only ever returns a suggestion to
// confirm — never a match to auto-accept — so a wrong guess here just
// costs an extra "no thanks" tap, not a bad score. Returns null (rather
// than throwing) on any embedding-service failure or missing precomputed
// embeddings, so a Gateway outage degrades to today's typo-only behavior
// instead of breaking answer submission.
export async function findSemanticSuggestion(
  rawInput: string,
  answers: ChallengeAnswer[]
): Promise<string | null> {
  const candidates = answers.filter(
    (a): a is ChallengeAnswer & { embedding: number[] } =>
      Array.isArray((a as { embedding?: unknown }).embedding)
  );
  if (candidates.length < 1) return null;

  try {
    const guessEmbedding = await embedFingerprint(rawInput);
    const scored = candidates
      .map((a) => ({ answer: a, score: cosineSimilarity(guessEmbedding, a.embedding) }))
      .sort((x, y) => y.score - x.score);

    const [best, runnerUp] = scored;
    if (!best || best.score < MIN_SIMILARITY) return null;
    if (runnerUp && best.score - runnerUp.score < MIN_MARGIN) return null;

    return best.answer.canonicalAnswer;
  } catch {
    return null;
  }
}
