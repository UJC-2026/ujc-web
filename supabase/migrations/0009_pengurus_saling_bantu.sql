-- Policy change, decided by the community: any active pengurus may write in
-- any division's area, so that when someone is busy, travelling, or between
-- shifts, another pengurus can step in and keep things moving.
--
-- This deliberately replaces the earlier "only the owning division writes"
-- rule. What keeps it accountable is the audit trail (log_audit) plus the
-- recorded author on each row — not the ability to write.
--
-- Unchanged on purpose:
--   * ordinary members still cannot touch any of these tables;
--   * role and verification changes are still admin-only, guarded by
--     profiles_guard_privileges;
--   * public read policies are untouched.

-- A single predicate so every table below relaxes identically, and so a future
-- change only has to happen in one place.
create or replace function can_manage_pengurus_area()
returns boolean language sql stable security definer set search_path = public as $$
  select is_pengurus() or is_admin();
$$;

grant execute on function can_manage_pengurus_area() to authenticated;

do $$
declare
  -- table name -> policy name being replaced
  target record;
begin
  for target in
    select * from (values
      ('finance_transactions', 'bendahara kelola kas'),
      ('member_dues',          'bendahara kelola iuran'),
      ('peduli_donations',     'bendahara kelola donasi'),
      ('event_budgets',        'bendahara & pimpinan putuskan anggaran'),
      ('event_budgets',        'divisi acara ajukan anggaran'),
      ('meeting_notes',        'sekretaris kelola notulen'),
      ('documents',            'sekretaris kelola dokumen'),
      ('announcements',        'media kelola pengumuman'),
      ('content_calendar',     'media kelola kalender konten'),
      ('gallery_photos',       'media kelola galeri unggulan'),
      ('blog_posts',           'divisi media kelola artikel'),
      ('partners',             'admin & media kelola partner'),
      ('cbt_test_categories',  'divisi pendidikan kelola kategori tes'),
      ('cbt_questions',        'divisi pendidikan kelola bank soal'),
      ('resources',            'divisi pendidikan kelola resource'),
      ('events',               'divisi acara kelola event'),
      ('event_checkins',       'divisi acara kelola checkin'),
      ('certificates',         'divisi acara terbitkan sertifikat'),
      ('workshops',            'divisi acara & pendidikan kelola workshop'),
      ('programs',             'divisi kelola prokernya')
    ) as t(tbl, pol)
  loop
    execute format('drop policy if exists %I on %I', target.pol, target.tbl);
  end loop;
end;
$$;

-- One permissive write policy per table, identical everywhere.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'finance_transactions', 'member_dues', 'peduli_donations', 'event_budgets',
    'meeting_notes', 'documents',
    'announcements', 'content_calendar', 'gallery_photos', 'blog_posts',
    'partners',
    'cbt_test_categories', 'cbt_questions', 'resources',
    'events', 'event_checkins', 'certificates', 'workshops',
    'programs'
  ]
  loop
    execute format(
      'create policy "pengurus kelola %1$s" on %1$I for all
         using (can_manage_pengurus_area())
         with check (can_manage_pengurus_area())',
      tbl
    );
  end loop;
end;
$$;

-- Every pengurus can now see the whole workspace, not just their own corner.
drop policy if exists "rsvp terlihat pengurus & pemilik" on event_rsvp;
create policy "rsvp terlihat pengurus & pemilik" on event_rsvp for select
  using (user_id = auth.uid() or is_pengurus());
