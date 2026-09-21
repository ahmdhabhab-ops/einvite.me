-- Stores the real, hidden video for a paid live stream, kept completely
-- separate from the invitation's normal saved data. Only ever read/written
-- by the set-livestream-video / get-livestream-video edge functions, which
-- use the service role key (bypassing RLS) — deliberately no policies
-- below, so the anon key can never read or write this table directly.
create table if not exists public.livestream_secrets (
  invitation_slug text primary key,
  provider text not null,
  video_id text not null,
  owner_key text not null,
  updated_at timestamptz not null default now()
);

alter table public.livestream_secrets enable row level security;
