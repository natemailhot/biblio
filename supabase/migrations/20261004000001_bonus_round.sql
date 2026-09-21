-- Optional "second chance" round: after the Scripture Bonus and before
-- results are revealed, a player may opt into 5 minutes to go back over
-- the same 5 questions and pick up any they missed, freely switching
-- between them. Its score starts from what they already answered
-- correctly in the main round and only grows from there — it never
-- changes ascent_score/total_score on game_sessions, and feeds its own
-- separate, shareable score and leaderboard.
create table bonus_round_sessions (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null unique references game_sessions(id) on delete cascade,
  daily_set_id uuid not null references daily_sets(id),
  user_id uuid references auth.users(id) on delete set null,
  anon_id uuid,
  baseline_score integer not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  completed_at timestamptz,
  final_score integer,
  created_at timestamptz not null default now()
);

create index idx_bonus_round_sessions_daily_set on bonus_round_sessions (daily_set_id);
create index idx_bonus_round_sessions_user on bonus_round_sessions (user_id) where user_id is not null;

create table bonus_round_answers (
  id uuid primary key default gen_random_uuid(),
  bonus_round_session_id uuid not null references bonus_round_sessions(id) on delete cascade,
  challenge_id uuid not null references daily_challenges(id),
  slot integer not null,
  raw_input text not null default '',
  normalized_input text not null default '',
  submitted_at_ms bigint not null,
  matched_answer_id uuid references challenge_answers(id),
  result submitted_answer_result not null,
  score integer,
  tier answer_tier,
  canonical_answer text,
  explanation text,
  "references" jsonb,
  created_at timestamptz not null default now()
);

create index idx_bonus_round_answers_session on bonus_round_answers (bonus_round_session_id);
create index idx_bonus_round_answers_session_challenge on bonus_round_answers (bonus_round_session_id, challenge_id);

alter table bonus_round_sessions enable row level security;
alter table bonus_round_answers enable row level security;
