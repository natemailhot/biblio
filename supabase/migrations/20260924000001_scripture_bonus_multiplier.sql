-- Scripture Bonus becomes a multiplier on the Ascent score instead of a
-- flat point award, with the player choosing one precision level to guess
-- at (no retries, unlike the Ascent questions):
--   testament only -> 1.10x, book -> 1.30x, book+chapter -> 1.50x,
--   book+chapter+verse -> 2.00x. Wrong/no guess -> 1.00x (no change).
alter table game_sessions
  drop column if exists scripture_bonus_score,
  add column scripture_bonus_multiplier numeric(3, 2) not null default 1.00,
  add column scripture_bonus_level text;

alter table game_sessions
  add constraint game_sessions_scripture_bonus_level_check
  check (scripture_bonus_level is null or scripture_bonus_level in ('testament', 'book', 'chapter', 'verse'));

-- bonus_points was a flat per-verse award; scoring is now a fixed formula
-- (see above), so this column is no longer used.
alter table scripture_bonus drop column if exists bonus_points;
