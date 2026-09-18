-- Scripture Dive core schema
-- Mirrors the data model in plan.md: daily_challenges, challenge_answers,
-- scripture_bonus, game_sessions (+ submitted_answers).

create extension if not exists "pgcrypto";

create type canon_scope as enum ('protestant-66', 'catholic-73', 'orthodox', 'custom');
create type challenge_status as enum ('draft', 'review', 'scheduled', 'published', 'archived');
create type answer_tier as enum ('familiar', 'known', 'deep-cut', 'daily-gem');
create type bonus_difficulty as enum ('easy', 'medium', 'hard');
create type session_mode as enum ('timed', 'accessibility');
create type submitted_answer_result as enum ('accepted', 'duplicate', 'invalid');

-- scripture_bonus first: daily_challenges references it.
create table scripture_bonus (
  id uuid primary key default gen_random_uuid(),
  display_text text not null,
  book text not null,
  chapter integer not null,
  verse_start integer not null,
  verse_end integer,
  reference_display text not null,
  translation text not null,
  licensing_metadata text not null,
  context_note text not null,
  accepted_book_aliases text[] not null default '{}',
  bonus_points integer not null default 25,
  difficulty bonus_difficulty not null default 'medium',
  canon_scope canon_scope not null default 'protestant-66',
  created_at timestamptz not null default now()
);

create table daily_challenges (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  prompt text not null,
  instructions text not null,
  what_counts text not null,
  duration_seconds integer not null default 90,
  canon_scope canon_scope not null default 'protestant-66',
  -- Points at the answer-set version that is currently authoritative for this
  -- challenge. New versions can be added to challenge_answers without
  -- mutating/deleting prior rows, so historical game_sessions stay valid.
  answer_set_version text not null default 'v1',
  daily_gem_answer_id uuid,
  scripture_bonus_id uuid references scripture_bonus(id),
  status challenge_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table challenge_answers (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references daily_challenges(id) on delete cascade,
  -- Which answer_set_version of the parent challenge this row belongs to.
  -- Editors revise content by inserting new rows under a new version rather
  -- than mutating scored history.
  answer_set_version text not null default 'v1',
  canonical_answer text not null,
  normalized_answer text not null,
  aliases text[] not null default '{}',
  score integer not null check (score between 1 and 100),
  tier answer_tier not null,
  "references" jsonb not null default '[]',
  explanation text not null,
  inclusion_notes text,
  exclusions text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (challenge_id, answer_set_version, normalized_answer)
);

alter table daily_challenges
  add constraint daily_challenges_daily_gem_fk
  foreign key (daily_gem_answer_id) references challenge_answers(id);

create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  challenge_id uuid not null references daily_challenges(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  mode session_mode not null default 'timed',
  dive_score integer not null default 0,
  scripture_bonus_answer text,
  scripture_bonus_correct boolean,
  scripture_bonus_score integer not null default 0,
  total_score integer not null default 0,
  -- Snapshot of the answer_set_version active at play time, so later content
  -- revisions never change the meaning of a historical session's score.
  answer_set_version text not null
);

create table submitted_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  raw_input text not null,
  normalized_input text not null,
  submitted_at_ms bigint not null,
  matched_answer_id uuid references challenge_answers(id),
  result submitted_answer_result not null
);

create index idx_challenge_answers_challenge on challenge_answers(challenge_id, answer_set_version);
create index idx_daily_challenges_date on daily_challenges(date);
create index idx_game_sessions_challenge on game_sessions(challenge_id);
create index idx_submitted_answers_session on submitted_answers(session_id);

-- RLS: content tables are publicly readable metadata only via the API layer
-- (the app must never expose unrevealed challenge_answers rows to the
-- client before a round ends), so keep RLS on and rely on the service role
-- key server-side for all reads/writes in Phase 1. No public policies yet.
alter table daily_challenges enable row level security;
alter table challenge_answers enable row level security;
alter table scripture_bonus enable row level security;
alter table game_sessions enable row level security;
alter table submitted_answers enable row level security;
