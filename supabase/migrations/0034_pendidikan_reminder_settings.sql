-- Divisi pendidikan owns the academic reminder, but `site_settings` only ever
-- granted writes to admin and divisi media (0031) — so the people responsible
-- for the wording were the one group that could not change it.
--
-- Scoped to the three reminder keys rather than widening the whole table.
-- site_settings also holds the homepage video, which belongs to media; the
-- point of this policy is to hand over one area, not to make every setting
-- everyone's. Policies are permissive, so this adds to what admin and media
-- can already do without touching it.
--
-- `starts_with` rather than LIKE: `_` is a wildcard in LIKE, and
-- 'academic_reminder_%' would also match keys nobody intended to hand over.

create policy "pendidikan kelola reminder akademik" on site_settings
  for all
  using (has_divisi('pendidikan') and starts_with(key, 'academic_reminder_'))
  with check (has_divisi('pendidikan') and starts_with(key, 'academic_reminder_'));
