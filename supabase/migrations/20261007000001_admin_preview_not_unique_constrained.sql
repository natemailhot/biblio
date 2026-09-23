-- Admin preview-play sessions (is_admin_preview) shouldn't compete with
-- real completed sessions for the same day/identity. Without this, an
-- admin previewing a day before it goes live permanently occupies that
-- day's "one completed session" slot — once the day actually becomes
-- today, they can never play it for real: the "already completed" check
-- finds the preview session and redirects straight to its (excluded,
-- non-counting) results, and even if that check were bypassed, completing
-- a second real session would violate this same unique index.
drop index if exists game_sessions_one_completed_per_user_per_day;
drop index if exists game_sessions_one_completed_per_anon_per_day;

create unique index game_sessions_one_completed_per_user_per_day
  on game_sessions (daily_set_id, user_id)
  where user_id is not null and completed_at is not null and is_admin_preview = false;

create unique index game_sessions_one_completed_per_anon_per_day
  on game_sessions (daily_set_id, anon_id)
  where anon_id is not null and completed_at is not null and is_admin_preview = false;
