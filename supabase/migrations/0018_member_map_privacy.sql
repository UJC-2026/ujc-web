-- The member map is supposed to show city level only — the spec is explicit
-- that a member's exact address must not be exposed. But the select policy
-- published the whole row to anyone whenever is_visible was true, including
-- lat/lng next to user_id. At four decimal places that is roughly 11 metres:
-- a home address, not a city.
--
-- Verified before writing this: an anonymous request returned
-- {"user_id":"…","city":"Hamamatsu","lat":34.7108,"lng":137.7261}.
--
-- Individual rows are now private to their owner. The map is fed by an
-- aggregate function that returns counts per prefecture and city and no
-- coordinates at all, so nothing precise can leave the database even if a
-- future page asks for it. The app plots fixed prefecture centroids it ships
-- itself.

drop policy if exists "lokasi anggota yang bersedia tampil" on member_locations;

create policy "anggota lihat lokasinya sendiri" on member_locations for select
  using (user_id = auth.uid() or is_admin());

-- Counts only. `is_visible` is still honoured: opting out removes a member
-- from the tally entirely.
create or replace function member_map_points()
returns table (
  prefecture text,
  city text,
  member_count bigint
) language sql stable security definer set search_path = public as $$
  select prefecture, city, count(*)
  from member_locations
  where is_visible
  group by prefecture, city
  order by count(*) desc, prefecture;
$$;

grant execute on function member_map_points() to anon, authenticated;

-- Prefecture totals for the map itself, kept separate so the city list can be
-- shown without implying a pin per city.
create or replace function member_map_prefectures()
returns table (prefecture text, member_count bigint)
language sql stable security definer set search_path = public as $$
  select prefecture, count(*)
  from member_locations
  where is_visible
  group by prefecture
  order by count(*) desc;
$$;

grant execute on function member_map_prefectures() to anon, authenticated;
