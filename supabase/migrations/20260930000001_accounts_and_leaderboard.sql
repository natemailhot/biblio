-- Optional accounts: signing in is never required to play (game_sessions
-- stays anonymous-by-default via user_id being nullable), but a signed-in
-- player gets their sessions linked to a profile for cross-device history,
-- a stats page, and the public leaderboard.
--
-- Like every other table here, profiles is read/written exclusively through
-- server API routes using the service-role client (see game_sessions,
-- challenge_answers, etc.) rather than direct client-side Supabase calls,
-- so RLS is enabled with no anon/authenticated policies — default deny,
-- service role bypasses RLS as usual.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- Case-insensitive uniqueness ("Nate" and "nate" can't both be taken).
create unique index profiles_username_lower_key on profiles (lower(username));

alter table profiles enable row level security;

-- game_sessions already had a bare, unconstrained user_id column reserved
-- from the original schema; give it real referential integrity now that
-- it's actually used.
alter table game_sessions
  add constraint game_sessions_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

create index idx_game_sessions_user on game_sessions(user_id) where user_id is not null;
