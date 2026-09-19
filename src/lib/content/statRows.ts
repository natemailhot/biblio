import type { PlayerStats } from "@/lib/types";

// Single source of truth for which stats are shown and how, so the
// account popover's mini summary and the full /stats page can't drift
// out of sync with each other.
export const STAT_ROWS: { key: keyof Omit<PlayerStats, "history">; label: string; format: (v: number) => string }[] = [
  { key: "played", label: "Played", format: (v) => String(v) },
  { key: "dayStreak", label: "Day streak", format: (v) => String(v) },
  { key: "averageScore", label: "Average score", format: (v) => String(v) },
  { key: "bestScore", label: "Best day", format: (v) => String(v) },
  { key: "averageMultiplier", label: "Average Scripture Bonus", format: (v) => `×${v.toFixed(2)}` },
];
