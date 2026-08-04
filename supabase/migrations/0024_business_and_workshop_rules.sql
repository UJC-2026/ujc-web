-- Two gaps, both the same shape as ones already fixed elsewhere.
--
-- 1. BUSINESS DIRECTORY. `pemilik kelola bisnisnya` is FOR ALL on
--    `owner_id = auth.uid()` and says nothing about `is_verified`, so a member
--    could insert their own listing already marked verified and have it appear
--    publicly at once — skipping the admin review the directory exists for.
--    Verified before writing this: the insert succeeded and an anonymous
--    request could read it immediately.
--
--    A guard trigger rather than a tighter WITH CHECK, for the same reason as
--    blog posts (0017): an owner must still be able to edit an already-verified
--    listing without the unchanged `true` being rejected.
--
-- 2. WORKSHOP CAPACITY. `workshops.capacity` was never enforced, and the
--    registration count could not be shown publicly anyway — registrations are
--    readable only by the registrant and pengurus, so counting rows returns
--    zero for everyone else. Same shape as events.going_count (0007).

-- ---------------------------------------------------------------------------
-- 1. business verification gate
-- ---------------------------------------------------------------------------

create or replace function guard_business_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if is_moderator() or can_manage_pengurus_area() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.is_verified then
    raise exception 'Bisnis harus ditinjau pengurus dulu sebelum tampil.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and new.is_verified is distinct from old.is_verified then
    raise exception 'Hanya pengurus yang bisa mengubah status verifikasi bisnis.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger businesses_guard_verification
  before insert or update on businesses
  for each row execute function guard_business_verification();

-- ---------------------------------------------------------------------------
-- 2. workshop capacity + public tally
-- ---------------------------------------------------------------------------

alter table workshops add column registered_count int not null default 0;

create or replace function validate_workshop_registration()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  w workshops;
  taken int;
begin
  select * into w from workshops where id = new.workshop_id;

  if w is null then
    raise exception 'Workshop tidak ditemukan.' using errcode = '23503';
  end if;

  if w.scheduled_at <= now() then
    raise exception 'Workshop ini sudah lewat, pendaftaran ditutup.'
      using errcode = '22023';
  end if;

  if w.capacity is not null then
    select count(*) into taken
    from workshop_registrations where workshop_id = new.workshop_id;

    if taken >= w.capacity then
      raise exception 'Kuota workshop ini sudah penuh (%).', w.capacity
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

create trigger workshop_registrations_validate
  before insert on workshop_registrations
  for each row execute function validate_workshop_registration();

create or replace function sync_workshop_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid := coalesce(new.workshop_id, old.workshop_id);
begin
  update workshops w
    set registered_count = (
      select count(*) from workshop_registrations r where r.workshop_id = target
    )
    where w.id = target;
  return null;
end;
$$;

create trigger workshop_registrations_sync_count
  after insert or delete on workshop_registrations
  for each row execute function sync_workshop_count();

update workshops w
set registered_count = coalesce(
  (select count(*) from workshop_registrations r where r.workshop_id = w.id), 0);
