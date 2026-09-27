-- Closes the event-day tables to the website's public anon key (and to
-- signed-in Supabase users), leaving them to the service_role key the app's
-- own server uses:
--   song_requests          - DJ requests; read by the couple or the DJ link
--   voice_messages         - guests' recorded messages; read by the couple
--   guest_checkins         - QR check-in tokens; read by the couple or the
--                            check-in staff link
--   networking_guests,
--   networking_connections,
--   networking_messages    - the networking directory and guests' chats
--
-- The app now reads and writes them through /api/song-requests,
-- /api/voice-messages, /api/checkins and /api/networking/*, which check who
-- is asking. Run it as the tables' owner (supabase_admin), and only once the
-- app is deployed with that change and tested, or these features stop working.
--
-- To undo:
--   grant select, insert, update on public.song_requests, public.voice_messages, public.guest_checkins, public.networking_guests, public.networking_connections, public.networking_messages to anon, authenticated;
--   create policy "insert" on public.song_requests for insert with check (true);
--   create policy "read" on public.song_requests for select using (true);
--   create policy "update" on public.song_requests for update using (true);
--   (and the same "insert"/"read"/"update" policies on the other tables)

drop policy if exists "insert" on public.song_requests;
drop policy if exists "read" on public.song_requests;
drop policy if exists "update" on public.song_requests;
drop policy if exists "insert" on public.voice_messages;
drop policy if exists "read" on public.voice_messages;
drop policy if exists "update" on public.voice_messages;
drop policy if exists "insert" on public.guest_checkins;
drop policy if exists "read" on public.guest_checkins;
drop policy if exists "update" on public.guest_checkins;
drop policy if exists "insert" on public.networking_guests;
drop policy if exists "read" on public.networking_guests;
drop policy if exists "update" on public.networking_guests;
drop policy if exists "insert" on public.networking_connections;
drop policy if exists "read" on public.networking_connections;
drop policy if exists "update" on public.networking_connections;
drop policy if exists "insert" on public.networking_messages;
drop policy if exists "read" on public.networking_messages;
drop policy if exists "update" on public.networking_messages;

alter table public.song_requests enable row level security;
alter table public.voice_messages enable row level security;
alter table public.guest_checkins enable row level security;
alter table public.networking_guests enable row level security;
alter table public.networking_connections enable row level security;
alter table public.networking_messages enable row level security;

revoke all on public.song_requests, public.voice_messages, public.guest_checkins, public.networking_guests, public.networking_connections, public.networking_messages from anon, authenticated;

notify pgrst, 'reload schema';
