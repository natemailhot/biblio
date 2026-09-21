-- Policy change: a question's 100pt ("Third Heaven") answer is no longer a
-- forced exactly-one-per-question slot. Some questions genuinely have a
-- standout rarest/most-surprising answer (maybe more than one), others
-- don't — that's now a per-question editorial judgment call instead of a
-- constraint the content has to be bent to satisfy.
--
-- Drop the max-one-100pt-per-challenge index so multiple answers on the same
-- question can score 100. "Daily Gem" status is now derived directly from
-- score = 100 (see is_daily_gem in submitted_answers / the answer-submission
-- route) rather than from a single designated answer, so the
-- daily_gem_answer_id pointer column is no longer used — drop it.
drop index if exists challenge_answers_one_hundred_per_challenge;

alter table daily_challenges drop constraint if exists daily_challenges_daily_gem_fk;
alter table daily_challenges drop column if exists daily_gem_answer_id;
