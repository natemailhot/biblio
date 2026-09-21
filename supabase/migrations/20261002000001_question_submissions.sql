-- Player-submitted question ideas for future days — a simple suggestion
-- box, same pattern as feedback_reports: written by anyone via the API
-- (service role only, no direct client access), reviewed manually later.
-- Not a public queue/voting system.
create table question_submissions (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  session_id uuid references game_sessions(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now()
);

alter table question_submissions enable row level security;
