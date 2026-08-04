-- mentorship_requests had no constraints beyond its foreign keys, so:
--   * a member could send the same mentor unlimited requests,
--   * a mentor who is also a member could request mentoring from themselves,
--   * a mentor could accept far past their stated capacity.
--
-- Capacity also could not be shown publicly: requests are visible only to the
-- mentee, the mentor, and divisi pendidikan, so a visitor counting accepted
-- rows would always see zero. The tally therefore lives on mentors, the same
-- shape as events.going_count (0007) and peduli_cases.collected_amount (0011).

alter table mentors add column active_mentees int not null default 0;

-- One live request per pair. Finished or rejected ones do not block a retry.
create unique index mentorship_requests_active_unique_idx
  on mentorship_requests (mentor_id, mentee_id)
  where status in ('menunggu', 'diterima');

create or replace function validate_mentorship_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m mentors;
  accepted int;
begin
  select * into m from mentors where id = new.mentor_id;

  if m is null then
    raise exception 'Mentor tidak ditemukan.' using errcode = '23503';
  end if;

  if m.user_id = new.mentee_id then
    raise exception 'Kamu tidak bisa mengajukan bimbingan ke dirimu sendiri.'
      using errcode = '22023';
  end if;

  if tg_op = 'INSERT' and not m.is_available then
    raise exception 'Mentor ini sedang tidak menerima bimbingan baru.'
      using errcode = '22023';
  end if;

  -- Only accepting consumes a slot, so the check belongs on that transition.
  if new.status = 'diterima'
     and (tg_op = 'INSERT' or old.status is distinct from 'diterima') then
    select count(*) into accepted
    from mentorship_requests
    where mentor_id = new.mentor_id and status = 'diterima' and id <> new.id;

    if accepted >= m.capacity then
      raise exception 'Kuota mentor ini sudah penuh (%).', m.capacity
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

create trigger mentorship_requests_validate
  before insert or update on mentorship_requests
  for each row execute function validate_mentorship_request();

-- ---------------------------------------------------------------------------
-- public tally
-- ---------------------------------------------------------------------------

create or replace function sync_mentor_load()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid := coalesce(new.mentor_id, old.mentor_id);
begin
  update mentors m
    set active_mentees = (
      select count(*) from mentorship_requests r
      where r.mentor_id = target and r.status = 'diterima'
    )
    where m.id = target;
  return null;
end;
$$;

create trigger mentorship_requests_sync_load
  after insert or update or delete on mentorship_requests
  for each row execute function sync_mentor_load();

update mentors m
set active_mentees = coalesce((
  select count(*) from mentorship_requests r
  where r.mentor_id = m.id and r.status = 'diterima'
), 0);

-- There was no delete policy at all, so a mentee could never take back a
-- request they sent by mistake. Withdrawal is limited to requests still
-- waiting: once a mentor has accepted, ending it is a shared decision and
-- goes through the 'selesai' status instead.
create policy "mentee tarik permintaan" on mentorship_requests for delete
  using (mentee_id = auth.uid() and status = 'menunggu');
