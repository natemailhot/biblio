// Day streak: consecutive day_numbers played, walking backward from the
// most recent one — only "live" if the most recent play was today or
// yesterday (relative to the player's local date, same day-rollover
// convention the rest of the app uses). `sortedDescDayNumbers` must
// already be deduped and sorted most-recent-first.
export function computeDayStreak(sortedDescDayNumbers: number[], todayDayNumber: number | null): number {
  if (sortedDescDayNumbers.length === 0 || todayDayNumber == null) return 0;

  const mostRecent = sortedDescDayNumbers[0];
  if (mostRecent !== todayDayNumber && mostRecent !== todayDayNumber - 1) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDescDayNumbers.length; i++) {
    if (sortedDescDayNumbers[i] === sortedDescDayNumbers[i - 1] - 1) streak++;
    else break;
  }
  return streak;
}
