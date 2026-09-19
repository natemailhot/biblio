-- A wrong guess no longer locks a question: players may keep guessing
-- until they get it right or the per-question timer runs out. Only one
-- *correct* guess is meaningful per question, enforced in application code
-- (reject further submissions once an 'accepted' row exists), so the old
-- one-row-per-question uniqueness no longer holds at the DB level.
alter table submitted_answers drop constraint if exists submitted_answers_session_id_challenge_id_key;

create index if not exists idx_submitted_answers_session_challenge
  on submitted_answers (session_id, challenge_id);

-- Timer default: 25s per question (was 15s).
alter table daily_challenges alter column duration_seconds set default 25;
update daily_challenges set duration_seconds = 25;
