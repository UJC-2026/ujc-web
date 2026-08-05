-- QR check-in and e-certificates for events.
--
-- The tables for this landed back in 0002 (`event_checkins`, `certificates`,
-- `events.checkin_code`) but nothing was ever wired to them, and two gaps in
-- that groundwork make the feature unusable as it stands:
--
--   1. `events` is published by "event publik" (`for select using (true)`),
--      which grants every column to every visitor — including `checkin_code`.
--      An attendance code the whole internet can read is not an attendance
--      code: anyone could mark themselves present at an event they never went
--      to and collect the 15 points (0020) and a certificate with it.
--
--   2. The only write policy on `event_checkins` is "divisi acara kelola
--      checkin". There is no path at all for a member to check themselves in,
--      which is the entire interaction the spec describes.
--
-- Both are fixed here the way the rest of this schema works: the secret moves
-- out of the publicly-readable row, and the one operation members need becomes
-- a security-definer function that enforces the rules, rather than a policy
-- that hands them the table.

-- ---------------------------------------------------------------------------
-- the code moves off the public row
-- ---------------------------------------------------------------------------

-- A column-level `revoke` on events.checkin_code would also have worked, but
-- every query in the app selects `events.*`; revoking one column turns all of
-- them into "permission denied for column checkin_code". A separate table has
-- no such trap.
create table event_checkin_codes (
  event_id uuid primary key references events (id) on delete cascade,
  code text not null check (char_length(btrim(code)) between 4 and 24),
  -- Check-in opens shortly before the event and closes after it. A code that
  -- leaks once the event is over is then worth nothing.
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

alter table event_checkin_codes enable row level security;

-- Deliberately no policy for ordinary members: they never read the code, they
-- submit it and the function below compares it. Pengurus acara need to read it
-- to print the QR.
create policy "divisi acara kelola kode" on event_checkin_codes for all
  using (has_divisi('acara') or is_admin())
  with check (has_divisi('acara') or is_admin());

grant select, insert, update, delete on event_checkin_codes to authenticated;

insert into event_checkin_codes (event_id, code)
select id, checkin_code from events
where checkin_code is not null and btrim(checkin_code) <> '';

alter table events drop column checkin_code;

-- ---------------------------------------------------------------------------
-- certificate numbering
-- ---------------------------------------------------------------------------

create sequence certificate_number_seq;

/** UJC/SRT/<year>/<6 digits>, e.g. UJC/SRT/2026/000042. */
create or replace function next_certificate_number()
returns text language sql volatile set search_path = public as $$
  select 'UJC/SRT/' || to_char(now(), 'YYYY') || '/' ||
         lpad(nextval('certificate_number_seq')::text, 6, '0');
$$;

-- ---------------------------------------------------------------------------
-- attendance implies a certificate
-- ---------------------------------------------------------------------------

/**
 * The spec asks for the certificate to be issued automatically to whoever
 * attended, so it hangs off the check-in row rather than off a button someone
 * has to remember to press. Runs for check-ins made by the attendee via
 * `checkin_event()` and for ones a pengurus records by hand.
 */
create or replace function issue_certificate_for_checkin()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ev events%rowtype;
begin
  select * into ev from events where id = new.event_id;

  insert into certificates (event_id, user_id, certificate_number)
  values (new.event_id, new.user_id, next_certificate_number())
  on conflict (event_id, user_id) do nothing;

  -- notify_user() stays silent when the target is the caller, so this only
  -- speaks up when a pengurus checked someone else in.
  perform notify_user(
    new.user_id,
    'sertifikat_terbit',
    'E-sertifikat kamu sudah terbit',
    'Kehadiranmu di "' || ev.title || '" sudah tercatat.',
    '/events/' || new.event_id || '/sertifikat'
  );

  return null;
end;
$$;

create trigger event_checkins_issue_certificate
  after insert on event_checkins
  for each row execute function issue_certificate_for_checkin();

-- ---------------------------------------------------------------------------
-- the member-facing operation
-- ---------------------------------------------------------------------------

/**
 * The only way a member can record their own attendance. Members hold no
 * insert policy on `event_checkins`; this runs as definer so the rules live in
 * one place instead of being spread across a policy that would have to trust
 * the client for the code.
 *
 * Returns the certificate number on success and raises a readable message
 * otherwise — the wrong code and the closed window are both things an ordinary
 * member will hit, so neither should surface as a generic failure.
 */
create or replace function checkin_event(
  p_event_id uuid,
  p_code text,
  p_method checkin_method default 'kode'
) returns text language plpgsql security definer set search_path = public as $$
declare
  ev events%rowtype;
  cfg event_checkin_codes%rowtype;
  opens timestamptz;
  closes timestamptz;
  cert text;
begin
  if auth.uid() is null then
    raise exception 'Masuk dulu untuk mencatat kehadiran.' using errcode = '42501';
  end if;

  select * into ev from events where id = p_event_id;
  if not found then
    raise exception 'Kegiatan tidak ditemukan.' using errcode = 'P0002';
  end if;

  select * into cfg from event_checkin_codes where event_id = p_event_id;
  if not found then
    raise exception 'Absensi untuk kegiatan ini belum dibuka pengurus.'
      using errcode = 'P0002';
  end if;

  -- Default window when the organiser did not set one explicitly: from three
  -- hours before the start until two days after, which covers arriving early
  -- and a webinar that runs long, without leaving attendance open forever.
  opens  := coalesce(cfg.opens_at,  ev.event_date - interval '3 hours');
  closes := coalesce(cfg.closes_at, ev.event_date + interval '48 hours');

  if now() < opens then
    raise exception 'Absensi belum dibuka. Coba lagi mendekati waktu acara.'
      using errcode = '22023';
  end if;

  if now() > closes then
    raise exception 'Absensi untuk kegiatan ini sudah ditutup.'
      using errcode = '22023';
  end if;

  -- Case- and whitespace-insensitive: the code gets typed off a screen or a
  -- printed sheet, and a trailing space should not read as the wrong code.
  if lower(btrim(p_code)) is distinct from lower(btrim(cfg.code)) then
    raise exception 'Kode kehadiran salah.' using errcode = '22023';
  end if;

  insert into event_checkins (event_id, user_id, method)
  values (p_event_id, auth.uid(), p_method)
  on conflict (event_id, user_id) do nothing;

  select certificate_number into cert
  from certificates
  where event_id = p_event_id and user_id = auth.uid();

  return cert;
end;
$$;

revoke all on function checkin_event(uuid, text, checkin_method) from public, anon;
grant execute on function checkin_event(uuid, text, checkin_method) to authenticated;

/**
 * Whether attendance is open right now. Members cannot read
 * `event_checkin_codes` at all, so without this the page has no way to tell
 * "panitia has not opened attendance" from "you typed the wrong code" — it
 * would have to show the form on every event and let everyone fail. Only the
 * boolean crosses the boundary; the code itself never does.
 */
create or replace function event_checkin_open(p_event_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from event_checkin_codes c
    join events e on e.id = c.event_id
    where c.event_id = p_event_id
      and now() >= coalesce(c.opens_at,  e.event_date - interval '3 hours')
      and now() <= coalesce(c.closes_at, e.event_date + interval '48 hours')
  );
$$;

grant execute on function event_checkin_open(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- attendee list for the organiser
-- ---------------------------------------------------------------------------

/**
 * `event_checkins` only exposes the caller's own row to a member, and joining
 * profiles from the client would need a second round trip per attendee. This
 * returns the roll for one event, and refuses anyone who is not pengurus.
 */
create or replace function event_attendees(p_event_id uuid)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  method checkin_method,
  checked_in_at timestamptz,
  certificate_number text
) language plpgsql stable security definer set search_path = public as $$
begin
  if not (is_pengurus() or is_admin()) then
    raise exception 'Hanya pengurus yang bisa melihat daftar kehadiran.'
      using errcode = '42501';
  end if;

  return query
    select c.user_id, p.full_name, p.avatar_url, c.method, c.checked_in_at,
           s.certificate_number
    from event_checkins c
    join profiles p on p.id = c.user_id
    left join certificates s
      on s.event_id = c.event_id and s.user_id = c.user_id
    where c.event_id = p_event_id
    order by c.checked_in_at desc;
end;
$$;

revoke all on function event_attendees(uuid) from public, anon;
grant execute on function event_attendees(uuid) to authenticated;

create index event_checkins_event_idx on event_checkins (event_id, checked_in_at desc);
