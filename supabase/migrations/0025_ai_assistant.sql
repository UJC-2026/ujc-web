-- Rate limiting for the AI assistant.
--
-- Every assistant reply costs real money, and the community pays for it. A
-- limit that lives only in the route handler is not a limit: `ai_chat_messages`
-- is reachable directly through PostgREST, and nothing stops a member from
-- calling the route in a loop. The ceiling is therefore enforced in the
-- database, where the count and the check happen in one place.
--
-- Counting rows in ai_chat_messages would not work either: the table is
-- per-member private, so a shared tally can't be read from it, and deleting a
-- conversation would silently refund the quota.

create table ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Tokyo')::date,
  message_count int not null default 0,
  unique (user_id, day)
);

alter table ai_usage enable row level security;

-- A member may see their own remaining quota; nobody may write it directly.
create policy "anggota lihat kuotanya" on ai_usage
  for select using (user_id = auth.uid());

create policy "pengurus lihat pemakaian ai" on ai_usage
  for select using (is_pimpinan());

grant select on ai_usage to authenticated;

-- The daily ceiling. Kept as a function so it can be changed without a
-- redeploy of the app.
create or replace function ai_daily_limit() returns int
  language sql immutable as $$ select 20 $$;

/**
 * Claims one message of today's quota, or raises if the member is out.
 *
 * Security definer because the member must not be able to write ai_usage
 * directly — otherwise the quota could simply be reset. The insert is
 * atomic, so two requests racing cannot both slip past the ceiling.
 */
create or replace function ai_claim_quota()
returns table (used int, quota int)
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  limit_per_day int := ai_daily_limit();
  new_count int;
begin
  if auth.uid() is null then
    raise exception 'Masuk dulu untuk memakai asisten.' using errcode = '42501';
  end if;

  insert into ai_usage (user_id, day, message_count)
  values (auth.uid(), today, 1)
  on conflict (user_id, day)
    do update set message_count = ai_usage.message_count + 1
  returning message_count into new_count;

  if new_count > limit_per_day then
    -- Undo the claim so the counter reflects reality, then refuse.
    update ai_usage set message_count = limit_per_day
      where user_id = auth.uid() and day = today;

    raise exception 'Kuota harian asisten habis (% pesan). Coba lagi besok.',
      limit_per_day using errcode = '22023';
  end if;

  return query select new_count, limit_per_day;
end;
$$;

/** Read-only view of today's usage, for showing the remaining count. */
create or replace function ai_quota_status()
returns table (used int, quota int)
language sql stable security definer set search_path = public as $$
  select
    coalesce((
      select u.message_count from ai_usage u
      where u.user_id = auth.uid()
        and u.day = (now() at time zone 'Asia/Tokyo')::date
    ), 0),
    ai_daily_limit();
$$;

grant execute on function ai_claim_quota() to authenticated;
grant execute on function ai_quota_status() to authenticated;

create index ai_chat_messages_session_idx
  on ai_chat_messages (session_id, created_at);
