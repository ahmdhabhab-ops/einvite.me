-- Telegram notification for the live chat (run after live_chat.sql).
--
-- When a visitor writes, the database itself posts a message to the
-- owner's Telegram bot through pg_net. It only notifies on the first
-- message of a conversation, or when the visitor writes again after 10
-- quiet minutes, so a burst of messages doesn't ring the phone each time.
--
-- The bot token and chat id live in live_chat_notify (no anon access):
--   insert into public.live_chat_notify (id, telegram_token, telegram_chat_id)
--   values (1, 'BOT-TOKEN', 'CHAT-ID')
--   on conflict (id) do update set telegram_token = excluded.telegram_token,
--                                  telegram_chat_id = excluded.telegram_chat_id;

create extension if not exists pg_net with schema extensions;

create table if not exists public.live_chat_notify (
  id int primary key default 1 check (id = 1),
  telegram_token text not null,
  telegram_chat_id text not null
);

alter table public.live_chat_notify enable row level security;
revoke all on public.live_chat_notify from anon, authenticated;

create or replace function public.live_chat_notify_telegram()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  cfg record;
  prev_at timestamptz;
  page_label text;
begin
  if new.sender <> 'visitor' then return new; end if;

  select * into cfg from live_chat_notify where id = 1;
  if not found then return new; end if;

  select max(m.created_at) into prev_at
  from live_chat_messages m
  where m.conversation_id = new.conversation_id and m.sender = 'visitor' and m.id < new.id;
  if prev_at is not null and prev_at > new.created_at - interval '10 minutes' then return new; end if;

  page_label := case new.page
    when 'home' then 'Home page'
    when 'shop' then 'Shop'
    when 'designs' then 'Designs'
    when 'builder' then 'Builder'
    else coalesce(new.page, 'Website')
  end;

  -- A notification problem must never stop the visitor's message from saving.
  begin
    perform net.http_post(
      url := 'https://api.telegram.org/bot' || cfg.telegram_token || '/sendMessage',
      body := jsonb_build_object(
        'chat_id', cfg.telegram_chat_id,
        'text', '💬 New live chat — ' || coalesce(new.visitor_name, 'Visitor') || ' (' || page_label || E'):\n'
                || left(new.body, 500)
                || E'\n\nReply: https://cores.einvite.me/admin',
        'disable_web_page_preview', true
      ),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  exception when others then
    raise warning 'live chat telegram notification failed: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.live_chat_notify_telegram() from public;

drop trigger if exists live_chat_notify_telegram on public.live_chat_messages;
create trigger live_chat_notify_telegram
  after insert on public.live_chat_messages
  for each row execute function public.live_chat_notify_telegram();
