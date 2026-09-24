-- Live chat between site visitors (home page, /shop, the Builder) and the
-- site owner, who answers from the admin app's "Live Chat" tab.
--
-- Everything goes through the security-definer functions below; the anon
-- key gets no direct access to either table. A visitor can only read the
-- conversation whose random id their own browser generated, and the admin
-- functions only work with the password stored in live_chat_admin.
--
-- Set the admin password (run once, pick your own password):
--   insert into public.live_chat_admin (key) values ('YOUR-PASSWORD')
--     on conflict (key) do nothing;

create table if not exists public.live_chat_messages (
  id bigint generated always as identity primary key,
  conversation_id text not null check (char_length(conversation_id) between 8 and 64),
  sender text not null check (sender in ('visitor', 'admin')),
  body text not null check (char_length(body) between 1 and 2000),
  visitor_name text check (visitor_name is null or char_length(visitor_name) <= 80),
  page text check (page is null or char_length(page) <= 40),
  created_at timestamptz not null default now()
);

create index if not exists live_chat_messages_conv_idx
  on public.live_chat_messages (conversation_id, id);

create table if not exists public.live_chat_admin (
  key text primary key
);

alter table public.live_chat_messages enable row level security;
alter table public.live_chat_admin enable row level security;
revoke all on public.live_chat_messages from anon, authenticated;
revoke all on public.live_chat_admin from anon, authenticated;

create or replace function public.live_chat_is_admin(p_key text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p_key is not null and exists (select 1 from live_chat_admin where key = p_key);
$$;

-- Visitor: send a message into their own conversation.
create or replace function public.live_chat_send(p_conversation text, p_body text, p_name text default null, p_page text default null)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare new_id bigint;
begin
  insert into live_chat_messages (conversation_id, sender, body, visitor_name, page)
  values (p_conversation, 'visitor', left(trim(p_body), 2000), nullif(left(trim(coalesce(p_name, '')), 80), ''), left(p_page, 40))
  returning id into new_id;
  return new_id;
end;
$$;

-- Visitor: read their own conversation (only messages newer than p_after).
create or replace function public.live_chat_fetch(p_conversation text, p_after bigint default 0)
returns table (id bigint, sender text, body text, created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select m.id, m.sender, m.body, m.created_at
  from live_chat_messages m
  where m.conversation_id = p_conversation and m.id > coalesce(p_after, 0)
  order by m.id
  limit 500;
$$;

-- Admin: one row per conversation, newest activity first.
create or replace function public.live_chat_admin_conversations(p_key text)
returns table (conversation_id text, visitor_name text, page text, last_id bigint, last_body text, last_sender text, last_at timestamptz, message_count bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not live_chat_is_admin(p_key) then raise exception 'not authorized' using errcode = '42501'; end if;
  return query
    select c.conversation_id,
           (select m.visitor_name from live_chat_messages m where m.conversation_id = c.conversation_id and m.visitor_name is not null order by m.id desc limit 1),
           (select m.page from live_chat_messages m where m.conversation_id = c.conversation_id and m.page is not null order by m.id desc limit 1),
           l.id, l.body, l.sender, l.created_at, c.cnt
    from (select g.conversation_id, max(g.id) as max_id, count(*) as cnt from live_chat_messages g group by g.conversation_id) c
    join live_chat_messages l on l.id = c.max_id
    order by c.max_id desc
    limit 200;
end;
$$;

-- Admin: full message list of one conversation.
create or replace function public.live_chat_admin_messages(p_key text, p_conversation text)
returns table (id bigint, sender text, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not live_chat_is_admin(p_key) then raise exception 'not authorized' using errcode = '42501'; end if;
  return query
    select m.id, m.sender, m.body, m.created_at
    from live_chat_messages m
    where m.conversation_id = p_conversation
    order by m.id
    limit 1000;
end;
$$;

-- Admin: reply into a conversation.
create or replace function public.live_chat_admin_reply(p_key text, p_conversation text, p_body text)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare new_id bigint;
begin
  if not live_chat_is_admin(p_key) then raise exception 'not authorized' using errcode = '42501'; end if;
  insert into live_chat_messages (conversation_id, sender, body)
  values (p_conversation, 'admin', left(trim(p_body), 2000))
  returning id into new_id;
  return new_id;
end;
$$;

-- Admin: delete a whole conversation.
create or replace function public.live_chat_admin_delete(p_key text, p_conversation text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not live_chat_is_admin(p_key) then raise exception 'not authorized' using errcode = '42501'; end if;
  delete from live_chat_messages where conversation_id = p_conversation;
end;
$$;

revoke all on function public.live_chat_is_admin(text) from public;
grant execute on function public.live_chat_send(text, text, text, text) to anon, authenticated;
grant execute on function public.live_chat_fetch(text, bigint) to anon, authenticated;
grant execute on function public.live_chat_admin_conversations(text) to anon, authenticated;
grant execute on function public.live_chat_admin_messages(text, text) to anon, authenticated;
grant execute on function public.live_chat_admin_reply(text, text, text) to anon, authenticated;
grant execute on function public.live_chat_admin_delete(text, text) to anon, authenticated;

-- Tell PostgREST to pick up the new functions right away.
notify pgrst, 'reload schema';
