-- peduli_cases.collected_amount was never maintained, so every progress bar
-- and impact figure would have read zero no matter how much came in.
--
-- It cannot be computed from peduli_donations at read time either: donations
-- are visible only to the donor, bendahara, and pimpinan, so an ordinary
-- visitor counting rows would always see 0. The same shape of bug as
-- events.going_count (migration 0007) — the public total has to live on the
-- parent row while the individual donations stay private.

alter table peduli_cases add column donation_count int not null default 0;

create or replace function sync_peduli_totals()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update peduli_cases
      set collected_amount = collected_amount + new.amount,
          donation_count = donation_count + 1
      where id = new.case_id;

  elsif tg_op = 'DELETE' then
    update peduli_cases
      set collected_amount = greatest(collected_amount - old.amount, 0),
          donation_count = greatest(donation_count - 1, 0)
      where id = old.case_id;

  elsif tg_op = 'UPDATE' then
    -- A correction may move a donation between cases, so undo then redo.
    if old.case_id <> new.case_id then
      update peduli_cases
        set collected_amount = greatest(collected_amount - old.amount, 0),
            donation_count = greatest(donation_count - 1, 0)
        where id = old.case_id;
      update peduli_cases
        set collected_amount = collected_amount + new.amount,
            donation_count = donation_count + 1
        where id = new.case_id;
    elsif old.amount <> new.amount then
      update peduli_cases
        set collected_amount = greatest(
              collected_amount - old.amount + new.amount, 0)
        where id = new.case_id;
    end if;
  end if;

  return null;
end;
$$;

create trigger peduli_donations_sync_totals
  after insert or update or delete on peduli_donations
  for each row execute function sync_peduli_totals();

-- Backfill anything seeded before the trigger existed.
update peduli_cases c
set collected_amount = coalesce(t.total, 0),
    donation_count = coalesce(t.n, 0)
from (
  select case_id, sum(amount) as total, count(*) as n
  from peduli_donations group by case_id
) t
where t.case_id = c.id;

-- Community-wide impact figures, readable by anyone. Individual donations and
-- the identity of recipients stay behind the existing policies; this exposes
-- only aggregates over cases that have already been made public.
create or replace function peduli_impact()
returns table (
  cases_helped bigint,
  total_collected bigint,
  total_donations bigint
) language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where status in ('berjalan', 'selesai')),
    coalesce(sum(collected_amount), 0),
    coalesce(sum(donation_count), 0)
  from peduli_cases
  where is_public;
$$;

grant execute on function peduli_impact() to anon, authenticated;
