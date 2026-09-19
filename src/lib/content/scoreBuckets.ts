// Shared bucket boundaries for the leaderboard's score-distribution
// histogram — used server-side to count entries and client-side to label
// the axis, so they can't drift apart.
export const SCORE_BUCKETS: { label: string; min: number; max: number | null }[] = [
  { label: "0-100", min: 0, max: 100 },
  { label: "100-150", min: 100, max: 150 },
  { label: "150-200", min: 150, max: 200 },
  { label: "200-250", min: 200, max: 250 },
  { label: "250-300", min: 250, max: 300 },
  { label: "300-350", min: 300, max: 350 },
  { label: "350+", min: 350, max: null },
];

export function bucketScores(scores: number[]): { label: string; count: number }[] {
  return SCORE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: scores.filter((s) => s >= bucket.min && (bucket.max === null || s < bucket.max)).length,
  }));
}
