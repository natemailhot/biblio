-- A wrong Scripture Bonus guess now costs a x0.75 penalty (was a neutral
-- x1.00, same as not guessing). Players can instead explicitly pick "I
-- don't know" for a neutral x1.00 with no risk. Add 'skip' as a valid level
-- so results can distinguish "guessed wrong at this precision" from
-- "declined to guess" (scripture_bonus_correct is now tri-state: true
-- correct, false wrong guess, null skipped — the column was already
-- nullable boolean, no change needed there).
alter table game_sessions drop constraint if exists game_sessions_scripture_bonus_level_check;
alter table game_sessions
  add constraint game_sessions_scripture_bonus_level_check
  check (scripture_bonus_level is null or scripture_bonus_level in ('testament', 'book', 'chapter', 'verse', 'skip'));
