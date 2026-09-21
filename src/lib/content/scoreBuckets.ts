// Shared bucket boundaries for the leaderboard's score-distribution
// histogram — used server-side to count entries and client-side to label
// the axis, so they can't drift apart.
export const SCORE_BUCKETS: { label: string; min: number; max: number | null }[] = [
  { label: "0-100", min: 0, max: 100 },
  { label: "100-200", min: 100, max: 200 },
  { label: "200-300", min: 200, max: 300 },
  { label: "300-400", min: 300, max: 400 },
  { label: "400-500", min: 400, max: 500 },
  { label: "500+", min: 500, max: null },
];

export function bucketScores(scores: number[]): { label: string; count: number }[] {
  return SCORE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: scores.filter((s) => s >= bucket.min && (bucket.max === null || s < bucket.max)).length,
  }));
}
