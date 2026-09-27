-- Locks the kv_store table so the website's public anon key can no longer
-- read or write it directly. Run this ONLY after the app is deployed with
-- SUPABASE_SERVICE_ROLE_KEY and ADMIN_PASSWORD set, and the logs show
-- "auth: server-side password checks are on": from then on the app reads
-- and writes kv_store through its own server (/api/kv), which uses the
-- service_role key and checks who is allowed to do what.
--
-- To undo (e.g. to roll back to an older version of the app):
--   alter table public.kv_store disable row level security;
--   grant select, insert, update, delete on public.kv_store to anon, authenticated;

alter table public.kv_store enable row level security;
revoke all on public.kv_store from anon, authenticated;

notify pgrst, 'reload schema';
