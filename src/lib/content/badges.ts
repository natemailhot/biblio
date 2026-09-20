import type { PlayerStats } from "@/lib/types";

// Ascend-specific badge set. fermi.gg's own badge criteria aren't
// publicly inspectable (they sit behind sign-in), so this is designed to
// fit Ascend's actual metrics rather than copied — same spirit (a
// public achievement gallery, checked off on the player's own stats
// page), different specifics.
export const BADGES: { key: string; icon: string; label: string; description: string; earned: (stats: PlayerStats) => boolean }[] = [
  {
    key: "first-ascent",
    icon: "🌄",
    label: "First Ascent",
    description: "Complete your first day.",
    earned: (s) => s.played >= 1,
  },
  {
    key: "week-streak",
    icon: "🔥",
    label: "Week Streak",
    description: "Play 7 days in a row.",
    earned: (s) => s.dayStreak >= 7,
  },
  {
    key: "month-streak",
    icon: "🕯️",
    label: "Month Streak",
    description: "Play 30 days in a row.",
    earned: (s) => s.dayStreak >= 30,
  },
  {
    key: "ten-days",
    icon: "📜",
    label: "Ten Days Strong",
    description: "Complete 10 total days.",
    earned: (s) => s.played >= 10,
  },
  {
    key: "high-climber",
    icon: "⛰️",
    label: "High Climber",
    description: "Score 400 or more in a single day.",
    earned: (s) => s.bestScore >= 400,
  },
  {
    key: "third-heaven",
    icon: "✦",
    label: "Third Heaven",
    description: "Average Scripture Bonus of ×1.5 or better.",
    earned: (s) => s.averageMultiplier >= 1.5,
  },
];
