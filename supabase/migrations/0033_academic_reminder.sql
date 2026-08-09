-- Weekend academic reminder: a nudge to open e-link and start the week's
-- assignments, timed for Saturday and Sunday in Japan because that is when
-- members are off shift and actually have hours to study.
--
-- No scheduler, for the same reason as close_due_auctions (0029): nothing in
-- Postgres fires when a date arrives, and pg_cron is deliberately not enabled
-- by migration. The reminder is claimed when the member turns up, which for an
-- in-app notification is the only moment it could be read anyway.
--
-- The honest limit of that: this reaches members who visit over the weekend.
-- Reaching the ones who do not is what Web Push and email are for, and both
-- are still on the backlog.

create table academic_reminder_log (
  user_id uuid not null references profiles (id) on delete cascade,
  -- Monday of the ISO week. Saturday and Sunday share one, so a member who
  -- opens the site on both days is reminded once, not twice.
  week_start date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table academic_reminder_log enable row level security;

-- Written only by the SECURITY DEFINER function below. Readable by admins so
-- "did the reminder go out?" has an answer that is not a guess.
create policy "admin lihat jejak reminder" on academic_reminder_log
  for select using (is_admin());

-- Wording lives in site_settings so it can be reworded without a deploy, the
-- same way the homepage video URL does (0031). Editing is admin/media under
-- the policy that table already has; giving divisi pendidikan its own write
-- access is an authorization change, and that belongs in its own migration
-- rather than riding along with this one.
insert into site_settings (key, value) values
  ('academic_reminder_title', null),
  ('academic_reminder_body', null),
  ('academic_reminder_link', null)
on conflict (key) do nothing;

/**
 * Creates this weekend's reminder for the caller, once, and reports whether
 * it did.
 *
 * The notification is inserted directly rather than through notify_user(),
 * which returns early when the target is the caller. That rule is right for
 * "si A membalas threadmu" and wrong here: the member's own visit is what
 * triggers their own reminder, so notify_user would refuse every one of them.
 * The opt-out check it performs is repeated below instead of skipped.
 *
 * Idempotency comes from the primary key, not from a read-then-write: two
 * tabs opening at once both reach the insert, and exactly one of them gets a
 * row back.
 */
create or replace function claim_academic_reminder()
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_now timestamp := now() at time zone 'Asia/Tokyo';
  v_title text;
  v_body text;
  v_link text;
begin
  if v_user is null then
    return false;
  end if;

  -- isodow: 6 = Saturday, 7 = Sunday. Weekdays cost one comparison and no
  -- query at all, which matters because this runs on every signed-in page.
  if extract(isodow from v_now) < 6 then
    return false;
  end if;

  if exists (
    select 1 from notification_preferences p
    where p.user_id = v_user
      and p.type = 'reminder_akademik'
      and not p.channel_inapp
  ) then
    return false;
  end if;

  insert into academic_reminder_log (user_id, week_start)
  values (v_user, date_trunc('week', v_now)::date)
  on conflict do nothing;

  -- Must be read before anything else touches FOUND.
  if not found then
    return false;
  end if;

  select value into v_title from site_settings where key = 'academic_reminder_title';
  select value into v_body from site_settings where key = 'academic_reminder_body';
  select value into v_link from site_settings where key = 'academic_reminder_link';

  insert into notifications (user_id, type, title, body, link)
  values (
    v_user,
    'reminder_akademik',
    coalesce(nullif(v_title, ''), 'Akhir pekan, waktunya buka e-link'),
    coalesce(
      nullif(v_body, ''),
      'Cek tugas yang jatuh tempo minggu ini selagi sedang libur shift.'
    ),
    nullif(v_link, '')
  );

  return true;
end;
$$;

grant execute on function claim_academic_reminder() to authenticated;
