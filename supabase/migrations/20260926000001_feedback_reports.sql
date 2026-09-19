-- "Report a missing answer" now writes here instead of opening a mailto
-- link, so it can be reviewed later directly (e.g. via the Supabase
-- dashboard) without needing an inbox. Public inserts happen through the
-- server-side service role client only — RLS stays on with no public
-- policies, same pattern as every other table.
create table feedback_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references game_sessions(id),
  daily_set_id uuid references daily_sets(id),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now()
);

create index idx_feedback_reports_status on feedback_reports(status, created_at);

alter table feedback_reports enable row level security;
