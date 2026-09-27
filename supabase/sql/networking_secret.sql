-- Gives each networking guest a private secret, created by the app's server
-- when the guest registers and kept only in that guest's browser. The server
-- asks for it before showing the directory, sending a connection request or
-- reading messages, so nobody can act as another guest just by knowing their
-- id. Guests who registered before this change have no secret and keep
-- working by id alone.
--
-- Run it BEFORE deploying the version of the app that adds it: the new server
-- writes this column when a guest registers.

alter table public.networking_guests add column if not exists secret text;

notify pgrst, 'reload schema';
