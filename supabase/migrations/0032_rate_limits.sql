-- Rate limiting for the actions where repetition does damage: forum posting,
-- marketplace listings, UJC Peduli donations, and starting a CBT attempt.
--
-- Enforced by triggers rather than in the server actions, for the reason that
-- runs through the rest of this schema: every one of these tables is reachable
-- directly through PostgREST with any member's token, so a check that only
-- exists in a server action is a check an attacker simply routes around.
--
-- The ledger is separate from the content tables on purpose. Counting the rows
-- themselves would let anyone refund their own quota by deleting what they
-- posted — and deleting your own thread is allowed.

create table rate_limit_events (
  id bigserial primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_lookup_idx
  on rate_limit_events (user_id, action, created_at desc);

alter table rate_limit_events enable row level security;

-- Nobody writes this table directly; the trigger below is SECURITY DEFINER and
-- owns every insert. Admins can read it to tell abuse from a broken limit.
create policy "admin lihat jejak batas" on rate_limit_events
  for select using (is_admin());

grant select on rate_limit_events to authenticated;

-- ---------------------------------------------------------------------------
-- the limits themselves
-- ---------------------------------------------------------------------------

-- Kept as data, not as trigger arguments, so a ceiling can be retuned with one
-- update when the community finds a number too tight — no migration, no
-- redeploy. The wording lives here too, beside the number it quotes.
create table rate_limits (
  action text primary key,
  max_count int not null check (max_count > 0),
  window_seconds int not null check (window_seconds > 0),
  -- `%s` is filled with max_count, so the sentence cannot drift from the limit.
  message text not null
);

alter table rate_limits enable row level security;

create policy "batas terbaca semua" on rate_limits for select using (true);

create policy "admin kelola batas" on rate_limits
  for all using (is_admin()) with check (is_admin());

grant select on rate_limits to anon, authenticated;

insert into rate_limits (action, max_count, window_seconds, message) values
  ('forum_thread', 5, 3600,
   'Kamu sudah membuat %s thread dalam sejam terakhir. Istirahat sebentar, lalu lanjutkan.'),
  ('forum_reply', 20, 3600,
   'Kamu sudah mengirim %s balasan dalam sejam terakhir. Tunggu sebentar sebelum membalas lagi.'),
  ('marketplace_item', 10, 86400,
   'Kamu sudah memasang %s barang hari ini. Coba lagi besok.'),
  ('peduli_donation', 20, 3600,
   'Kamu sudah mencatat %s donasi dalam sejam terakhir. Tunggu sebentar sebelum menambah lagi.'),
  ('cbt_attempt', 20, 3600,
   'Kamu sudah memulai %s percobaan tes dalam sejam terakhir. Istirahat dulu sebentar.');

-- ---------------------------------------------------------------------------
-- enforcement
-- ---------------------------------------------------------------------------

/**
 * Refuses an insert once the caller has spent their allowance for TG_ARGV[0]
 * inside its window, and records the attempt otherwise.
 *
 * SECURITY DEFINER because the ledger must be unreachable from the member: a
 * counter you can delete from is not a counter. Raises SQLSTATE 54000
 * (program_limit_exceeded) so the app can tell "you are going too fast" apart
 * from a genuine failure and pass this wording straight through.
 */
create or replace function enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_action text := tg_argv[0];
  v_limit rate_limits%rowtype;
  v_window interval;
  v_used int;
begin
  -- No JWT means the seed, a migration, or the service role is writing. Those
  -- are not the traffic this guards against, and throttling them would break
  -- `supabase start`.
  if v_user is null then
    return new;
  end if;

  -- Admins run bulk cleanups and post on behalf of the community.
  if is_admin() then
    return new;
  end if;

  select * into v_limit from rate_limits where action = v_action;

  -- An unconfigured action is not an excuse to block the member.
  if not found then
    return new;
  end if;

  v_window := make_interval(secs => v_limit.window_seconds);

  -- Pruning here keeps the ledger to roughly one window per active member,
  -- which is also what makes the count below a plain count of what is left.
  delete from rate_limit_events
  where user_id = v_user
    and action = v_action
    and created_at < now() - v_window;

  -- Counting and inserting are two statements, so two requests arriving
  -- together can both read the same total and both pass. That is left alone:
  -- the cost is one extra thread on a burst, and closing it means taking a
  -- lock per post on the hot path of every forum reply. This is a spam brake,
  -- not an accounting ledger.
  select count(*) into v_used
  from rate_limit_events
  where user_id = v_user and action = v_action;

  if v_used >= v_limit.max_count then
    raise exception '%', format(v_limit.message, v_limit.max_count)
      using errcode = '54000';
  end if;

  insert into rate_limit_events (user_id, action) values (v_user, v_action);

  return new;
end;
$$;

create trigger forum_threads_rate_limit
  before insert on forum_threads
  for each row execute function enforce_rate_limit('forum_thread');

create trigger forum_replies_rate_limit
  before insert on forum_replies
  for each row execute function enforce_rate_limit('forum_reply');

create trigger marketplace_items_rate_limit
  before insert on marketplace_items
  for each row execute function enforce_rate_limit('marketplace_item');

create trigger peduli_donations_rate_limit
  before insert on peduli_donations
  for each row execute function enforce_rate_limit('peduli_donation');

create trigger cbt_attempts_rate_limit
  before insert on cbt_attempts
  for each row execute function enforce_rate_limit('cbt_attempt');
