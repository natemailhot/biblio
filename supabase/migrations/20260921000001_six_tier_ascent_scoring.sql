-- Scoring model change: fixed point values (10, 20, 30, 60, 85, 100) instead
-- of open ranges, mapped onto six ascent stages instead of four. Exactly one
-- answer per challenge may score 100 (the Third Heaven / Daily Gem answer).

create type answer_tier_new as enum (
  'outer-court', 'bronze-altar', 'holy-place', 'veil', 'holy-of-holies', 'third-heaven'
);

alter table challenge_answers
  alter column tier type answer_tier_new
  using (
    case tier::text
      when 'familiar' then 'outer-court'
      when 'known' then 'bronze-altar'
      when 'deep-cut' then 'veil'
      when 'daily-gem' then 'third-heaven'
    end
  )::answer_tier_new;

drop type answer_tier;
alter type answer_tier_new rename to answer_tier;

alter table challenge_answers
  add constraint challenge_answers_score_values check (score in (10, 20, 30, 60, 85, 100));

-- Enforce "only 1 choice is 100" per challenge/answer-set-version.
create unique index challenge_answers_one_hundred_per_challenge
  on challenge_answers (challenge_id, answer_set_version)
  where score = 100;
