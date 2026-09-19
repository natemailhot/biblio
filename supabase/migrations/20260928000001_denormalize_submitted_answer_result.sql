-- The results page rebuilt each question's score/tier by joining
-- matched_answer_id against the *current* challenge_answers table. Content
-- edits are meant to happen via new rows/versions (see the comment on
-- challenge_answers), which silently breaks that join for anyone who played
-- before the edit: their total_score stays correct (it was written once,
-- at answer time), but their results tile goes blank. Store the scored
-- outcome directly on submitted_answers so it's an immutable snapshot,
-- immune to later content changes.

alter table submitted_answers
  add column score integer,
  add column tier answer_tier,
  add column canonical_answer text,
  add column explanation text,
  add column "references" jsonb,
  add column is_daily_gem boolean not null default false;

-- Backfill from the current (today, still-consistent) live join.
update submitted_answers sa
set
  score = ca.score,
  tier = ca.tier,
  canonical_answer = ca.canonical_answer,
  explanation = ca.explanation,
  "references" = ca."references",
  is_daily_gem = (dc.daily_gem_answer_id = ca.id)
from challenge_answers ca
join daily_challenges dc on dc.id = ca.challenge_id
where sa.matched_answer_id = ca.id
  and sa.result = 'accepted';
