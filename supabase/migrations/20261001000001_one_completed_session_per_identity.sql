-- Prevents the same player from racking up more than one *completed*
-- session for a given day — signed-in players are matched by user_id;
-- anonymous players are matched by a random first-party cookie (anon_id),
-- not fingerprinting, set on first play. This isn't hard anti-cheat
-- (clearing cookies / a new browser still resets it, same as the existing
-- localStorage courtesy-guard), but it closes the common case: coming
-- back on the same device/account after localStorage was cleared, in
-- private browsing, or from a different browser signed into the same
-- account.
--
-- In-progress (never completed) sessions are intentionally NOT
-- constrained — an abandoned attempt shouldn't block starting over, and
-- they don't feed stats/leaderboard anyway (both require completed_at).

alter table game_sessions
  add column anon_id uuid;

create unique index game_sessions_one_completed_per_user_per_day
  on game_sessions (daily_set_id, user_id)
  where user_id is not null and completed_at is not null;

create unique index game_sessions_one_completed_per_anon_per_day
  on game_sessions (daily_set_id, anon_id)
  where anon_id is not null and completed_at is not null;
