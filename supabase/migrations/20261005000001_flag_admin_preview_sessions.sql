-- Admin preview-play (/admin/day/[date]) reuses the normal game_sessions
-- flow so it can exercise the real session/answer/bonus-round pipeline —
-- but that means a preview of a future, unpublished day was silently
-- polluting the admin's own stats, day streak, and leaderboard eligibility
-- (a future-dated "most recent play" breaks the streak-continuity check
-- entirely, since it's never "today or yesterday"). Flag these sessions so
-- stats/leaderboard queries can exclude them.
alter table game_sessions
  add column is_admin_preview boolean not null default false;
