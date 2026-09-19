-- Product pivot: a "day" is now 5 single-guess questions (a "daily_set")
-- plus one Scripture Bonus, instead of one open-recall round. Each question
-- keeps its own full curated multi-answer set (unchanged scoring: 10/20/30/
-- 60/85/100, one 100pt answer per question) but the player gets exactly one
-- guess per question instead of many within a timer.
--
-- Existing data is test/seed content only, so this drops and recreates the
-- affected tables rather than attempting a lossy in-place migration.

drop table if exists submitted_answers;
drop table if exists game_sessions;
alter table daily_challenges drop constraint if exists daily_challenges_daily_gem_fk;
drop table if exists challenge_answers;
drop table if exists daily_challenges;

create table daily_sets (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  day_number integer not null unique,
  scripture_bonus_id uuid references scripture_bonus(id),
  status challenge_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table daily_challenges (
  id uuid primary key default gen_random_uuid(),
  daily_set_id uuid not null references daily_sets(id) on delete cascade,
  slot integer not null check (slot between 1 and 5),
  prompt text not null,
  instructions text not null,
  what_counts text not null,
  duration_seconds integer not null default 15,
  canon_scope canon_scope not null default 'protestant-66',
  answer_set_version text not null default 'v1',
  daily_gem_answer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_set_id, slot)
);

create table challenge_answers (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references daily_challenges(id) on delete cascade,
  answer_set_version text not null default 'v1',
  canonical_answer text not null,
  normalized_answer text not null,
  aliases text[] not null default '{}',
  score integer not null check (score in (10, 20, 30, 60, 85, 100)),
  tier answer_tier not null,
  "references" jsonb not null default '[]',
  explanation text not null,
  inclusion_notes text,
  exclusions text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (challenge_id, answer_set_version, normalized_answer)
);

create unique index challenge_answers_one_hundred_per_challenge
  on challenge_answers (challenge_id, answer_set_version)
  where score = 100;

alter table daily_challenges
  add constraint daily_challenges_daily_gem_fk
  foreign key (daily_gem_answer_id) references challenge_answers(id);

create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  daily_set_id uuid not null references daily_sets(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  mode session_mode not null default 'timed',
  ascent_score integer not null default 0,
  scripture_bonus_answer text,
  scripture_bonus_correct boolean,
  scripture_bonus_score integer not null default 0,
  total_score integer not null default 0
);

-- Tracks when a player was first shown a given question, so per-question
-- duration can be enforced server-side even though each question now has
-- its own independent timer rather than one round-level timer.
create table session_question_starts (
  session_id uuid not null references game_sessions(id) on delete cascade,
  challenge_id uuid not null references daily_challenges(id),
  started_at timestamptz not null default now(),
  primary key (session_id, challenge_id)
);

create table submitted_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  challenge_id uuid not null references daily_challenges(id),
  slot integer not null,
  answer_set_version text not null,
  raw_input text not null default '',
  normalized_input text not null default '',
  submitted_at_ms bigint not null,
  matched_answer_id uuid references challenge_answers(id),
  result submitted_answer_result not null,
  unique (session_id, challenge_id)
);

create index idx_challenge_answers_challenge on challenge_answers(challenge_id, answer_set_version);
create index idx_daily_challenges_daily_set on daily_challenges(daily_set_id);
create index idx_game_sessions_daily_set on game_sessions(daily_set_id);
create index idx_submitted_answers_session on submitted_answers(session_id);

alter table daily_sets enable row level security;
alter table daily_challenges enable row level security;
alter table challenge_answers enable row level security;
alter table game_sessions enable row level security;
alter table session_question_starts enable row level security;
alter table submitted_answers enable row level security;
