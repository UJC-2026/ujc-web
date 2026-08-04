-- Articles are meant to be reviewed before they go live, but nothing enforced
-- it. Two separate holes, either one enough on its own:
--
--   "anggota tulis artikel"   insert check: author_id = auth.uid()
--   "penulis ubah artikelnya" update check: author_id = auth.uid()
--
-- Neither mentions `status`, so a member could insert an article already set
-- to 'terbit' — instantly public — or flip their own draft to 'terbit' later.
-- Both were confirmed against the database before writing this.
--
-- Publishing is now reserved for pengurus and moderators. A guard trigger is
-- used rather than tightening the policies because an author must still be
-- able to edit an already-published article without the check rejecting the
-- unchanged 'terbit' value.

create or replace function guard_blog_publish()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  may_publish boolean := can_manage_pengurus_area() or is_moderator();
begin
  if may_publish then
    return new;
  end if;

  if tg_op = 'INSERT' and new.status = 'terbit' then
    raise exception 'Artikel harus ditinjau pengurus dulu sebelum terbit.'
      using errcode = '42501';
  end if;

  -- Editing your own article is fine; changing whether it is published is not.
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    raise exception 'Hanya pengurus yang bisa mengubah status terbit artikel.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger blog_posts_guard_publish
  before insert or update on blog_posts
  for each row execute function guard_blog_publish();

-- published_at should reflect the moment it actually went live, not whenever
-- the row was last touched.
create or replace function stamp_blog_published_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'terbit' and new.published_at is null then
    new.published_at := now();
  elsif new.status <> 'terbit' then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger blog_posts_stamp_published
  before insert or update on blog_posts
  for each row execute function stamp_blog_published_at();

create index if not exists blog_posts_published_idx
  on blog_posts (published_at desc) where status = 'terbit';
