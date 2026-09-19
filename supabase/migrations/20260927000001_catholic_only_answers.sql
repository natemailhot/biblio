-- Supports accepting deuterocanonical/Catholic-canon content (e.g. Tobit,
-- visited by the angel Raphael) as valid answers within existing broad
-- prompts, without changing the prompt's own canon_scope or ever making a
-- question/Scripture Bonus verse centered on those 7 books. Flagged answers
-- still score identically during live play; the flag only drives a
-- separate "Catholic canon" grouping in the post-round answer review.
alter table challenge_answers
  add column is_catholic_only boolean not null default false;
