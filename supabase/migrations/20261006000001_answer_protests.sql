-- Lets a player flag a specific question they believe they answered
-- correctly, right from the results screen. Deliberately NOT auto-applied
-- to scoring — a protest only queues for admin review, pre-triaged with a
-- diagnostic (the best fuzzy/semantic candidate the current answer set
-- would suggest for their exact guess), computed once at protest time so
-- review starts pre-sorted instead of cold.
create table answer_protests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  challenge_id uuid not null references daily_challenges(id),
  submitted_answer_id uuid references submitted_answers(id) on delete set null,
  raw_input text not null,
  player_note text,
  diagnostic jsonb,
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now()
);

create index idx_answer_protests_status on answer_protests (status, created_at);
create index idx_answer_protests_challenge on answer_protests (challenge_id);

alter table answer_protests enable row level security;
