-- Attendance numbers are public ("32 akan hadir"), but *who* is attending is
-- not: event_rsvp is readable only by the row owner and pengurus. Counting the
-- rows through PostgREST therefore returned 0 for ordinary visitors, and the
-- capacity guard in the RSVP action counted only the caller's own row, so it
-- never actually blocked anyone.
--
-- Keeping the tally in a column on events fixes both: the number is public,
-- the identities stay protected, and the guard reads a trustworthy total.
-- Same pattern already used for forum_threads.reply_count and .score.

alter table events add column going_count int not null default 0;

create or replace function sync_event_going_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'hadir' then
      update events set going_count = going_count + 1 where id = new.event_id;
    end if;

  elsif tg_op = 'DELETE' then
    if old.status = 'hadir' then
      update events set going_count = greatest(going_count - 1, 0)
        where id = old.event_id;
    end if;

  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'hadir' then
      update events set going_count = going_count + 1 where id = new.event_id;
    elsif old.status = 'hadir' then
      update events set going_count = greatest(going_count - 1, 0)
        where id = old.event_id;
    end if;
  end if;

  return null;
end;
$$;

create trigger event_rsvp_sync_going_count
  after insert or update or delete on event_rsvp
  for each row execute function sync_event_going_count();

-- Backfill for rows seeded before the trigger existed.
update events e
set going_count = coalesce(
  (select count(*) from event_rsvp r
    where r.event_id = e.id and r.status = 'hadir'),
  0
);
