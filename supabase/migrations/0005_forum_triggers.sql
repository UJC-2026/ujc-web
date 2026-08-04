-- Keeps forum_threads.reply_count and the vote score columns accurate, and
-- adds the keyword list backing automatic content flagging.

-- ---------------------------------------------------------------------------
-- reply_count
-- ---------------------------------------------------------------------------

create or replace function sync_thread_reply_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update forum_threads
      set reply_count = reply_count + 1
      where id = new.thread_id;
  elsif tg_op = 'DELETE' then
    update forum_threads
      set reply_count = greatest(reply_count - 1, 0)
      where id = old.thread_id;
  end if;
  return null;
end;
$$;

create trigger forum_replies_sync_count
  after insert or delete on forum_replies
  for each row execute function sync_thread_reply_count();

-- ---------------------------------------------------------------------------
-- vote score
--
-- A vote row targets either a thread or a reply (enforced by the
-- forum_votes_one_target check), so each branch touches one table only.
-- ---------------------------------------------------------------------------

create or replace function apply_vote_delta(
  target_thread uuid,
  target_reply uuid,
  delta int
) returns void language plpgsql security definer set search_path = public as $$
begin
  if target_thread is not null then
    update forum_threads set score = score + delta where id = target_thread;
  elsif target_reply is not null then
    update forum_replies set score = score + delta where id = target_reply;
  end if;
end;
$$;

create or replace function sync_vote_score()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  weight int;
begin
  if tg_op = 'INSERT' then
    perform apply_vote_delta(
      new.thread_id, new.reply_id,
      case when new.vote = 'up' then 1 else -1 end
    );
  elsif tg_op = 'DELETE' then
    perform apply_vote_delta(
      old.thread_id, old.reply_id,
      case when old.vote = 'up' then -1 else 1 end
    );
  elsif tg_op = 'UPDATE' and old.vote is distinct from new.vote then
    -- up -> down is a swing of 2, not 1
    weight := case when new.vote = 'up' then 2 else -2 end;
    perform apply_vote_delta(new.thread_id, new.reply_id, weight);
  end if;
  return null;
end;
$$;

create trigger forum_votes_sync_score
  after insert or update or delete on forum_votes
  for each row execute function sync_vote_score();

-- ---------------------------------------------------------------------------
-- automatic content filtering
-- ---------------------------------------------------------------------------

create table moderation_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  reason flag_reason not null,
  created_at timestamptz not null default now()
);

alter table moderation_keywords enable row level security;

create policy "moderator kelola kata kunci" on moderation_keywords for all
  using (is_moderator()) with check (is_moderator());

insert into moderation_keywords (keyword, reason) values
  ('judi online', 'judol'),
  ('judol', 'judol'),
  ('slot gacor', 'judol'),
  ('maxwin', 'judol'),
  ('rtp slot', 'judol'),
  ('situs slot', 'judol'),
  ('togel', 'judol'),
  ('investasi bodong', 'scam'),
  ('penggandaan uang', 'scam'),
  ('transfer dulu', 'scam'),
  ('dijamin untung', 'scam'),
  ('binary option', 'scam')
on conflict (keyword) do nothing;

-- Returns the reason a text trips the keyword list, or null when it is clean.
create or replace function match_moderation_keyword(body text)
returns flag_reason language sql stable security definer set search_path = public as $$
  select k.reason
  from moderation_keywords k
  where position(k.keyword in lower(body)) > 0
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- view counter (bypasses the "author only" update policy)
-- ---------------------------------------------------------------------------

create or replace function increment_thread_views(target uuid)
returns void language sql security definer set search_path = public as $$
  update forum_threads set view_count = view_count + 1 where id = target;
$$;
