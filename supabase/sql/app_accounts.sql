-- Client account passwords, stored hashed (scrypt) and only ever read by
-- the app's own server (server.js, with the service_role key). The anon key
-- the website uses gets no access at all, so the hashes can't be read from
-- the browser.
--
-- Everything else about an account (name, email, status...) still lives in
-- the users list of the einvite:draft-core row of kv_store; this table only
-- maps each user id to its password hash.

create table if not exists public.app_accounts (
  user_id text primary key check (char_length(user_id) between 1 and 100),
  password_hash text not null check (char_length(password_hash) between 20 and 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_accounts enable row level security;
revoke all on public.app_accounts from anon, authenticated;

-- Tell PostgREST to pick up the new table right away.
notify pgrst, 'reload schema';
