// Shared bucket boundaries for a leaderboard's score-distribution histogram
// — used server-side to count entries and client-side to label the axis,
// so they can't drift apart.
export type ScoreBucketDef = { label: string; min: number; max: number | null };

// Main Ascend leaderboard: a day tops out around 500 (5 questions at 100
// each), so tight 100-point steps stay meaningful the whole way up.
export const SCORE_BUCKETS: ScoreBucketDef[] = [
  { label: "0-100", min: 0, max: 100 },
  { label: "100-200", min: 100, max: 200 },
  { label: "200-300", min: 200, max: 300 },
  { label: "300-400", min: 300, max: 400 },
  { label: "400-500", min: 400, max: 500 },
  { label: "500+", min: 500, max: null },
];

// Bonus round leaderboard: unlimited answers per question means totals run
// far higher and spread out more than the main game — more buckets, and
// wider (growing) steps so the top end doesn't collapse into one catch-all.
export const BONUS_SCORE_BUCKETS: ScoreBucketDef[] = [
  { label: "0-100", min: 0, max: 100 },
  { label: "100-250", min: 100, max: 250 },
  { label: "250-500", min: 250, max: 500 },
  { label: "500-750", min: 500, max: 750 },
  { label: "750-1000", min: 750, max: 1000 },
  { label: "1000-1500", min: 1000, max: 1500 },
  { label: "1500-2000", min: 1500, max: 2000 },
  { label: "2000+", min: 2000, max: null },
];

export function bucketScores(
  scores: number[],
  buckets: ScoreBucketDef[] = SCORE_BUCKETS
): { label: string; count: number }[] {
  return buckets.map((bucket) => ({
    label: bucket.label,
    count: scores.filter((s) => s >= bucket.min && (bucket.max === null || s < bucket.max)).length,
  }));
}
