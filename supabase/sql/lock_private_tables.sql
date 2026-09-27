-- Closes four tables to the website's public anon key (and to signed-in
-- Supabase users), leaving them to the service_role key that the app's own
-- server and the edge functions use:
--   whatsapp_incoming  - every phone number the WhatsApp webhook has seen;
--                        the guest dashboard now reads delivery ticks through
--                        the app's server (/api/whatsapp-status)
--   package_purchases  - payments, written and read by the payment functions
--   guests, invitations - old tables the app no longer uses
--
-- Run it as the tables' owner (supabase_admin). Run it only once the app is
-- deployed with this change, or the dashboard's WhatsApp ticks stop updating.
--
-- To undo:
--   grant select, insert, update, delete on public.whatsapp_incoming, public.package_purchases, public.guests, public.invitations to anon, authenticated;
--   create policy "read" on public.whatsapp_incoming for select using (true);
--   create policy "read" on public.package_purchases for select using (true);

drop policy if exists "read" on public.whatsapp_incoming;
drop policy if exists "read" on public.package_purchases;
drop policy if exists "insert" on public.guests;
drop policy if exists "read" on public.guests;
drop policy if exists "update" on public.guests;
drop policy if exists "insert" on public.invitations;
drop policy if exists "read" on public.invitations;
drop policy if exists "update" on public.invitations;

alter table public.whatsapp_incoming enable row level security;
alter table public.package_purchases enable row level security;
alter table public.guests enable row level security;
alter table public.invitations enable row level security;

revoke all on public.whatsapp_incoming, public.package_purchases, public.guests, public.invitations from anon, authenticated;

notify pgrst, 'reload schema';
