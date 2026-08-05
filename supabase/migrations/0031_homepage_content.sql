-- Homepage content the spec asks for and nothing was ever wired to.
--
-- `partners` has existed since 0002, complete with policies — "partner publik"
-- for reading and "admin & media kelola partner" for writing — and has never
-- been read or written by a single line of the app. The spec asks for a
-- partner section on the homepage and "kelola partner" in the admin panel;
-- this migration adds the one thing that was actually missing for both.
--
-- That missing thing is somewhere to put homepage settings. The community
-- profile video is a single URL that pengurus must be able to change without a
-- deploy, and there was nowhere for it to live. A key/value table is the
-- smallest thing that works and takes the next such setting for free.

create table site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles (id) on delete set null
);

alter table site_settings enable row level security;

-- Read by the public homepage, so anonymous visitors need select. Nothing
-- secret goes in here; anything that needs hiding belongs in an env var, not
-- in a table the homepage reads.
create policy "pengaturan situs publik" on site_settings for select using (true);

create policy "admin & media kelola pengaturan" on site_settings for all
  using (has_divisi('media') or is_admin())
  with check (has_divisi('media') or is_admin());

grant select on site_settings to anon, authenticated;
grant insert, update, delete on site_settings to authenticated;

/**
 * Keeps `updated_at`/`updated_by` honest rather than trusting whatever the
 * client sends, the same way the rest of this schema treats audit columns.
 */
create or replace function touch_site_setting()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger site_settings_touch
  before insert or update on site_settings
  for each row execute function touch_site_setting();

-- Seeded empty: the homepage renders the video section only when this holds a
-- URL, so an unconfigured install simply does not show one.
insert into site_settings (key, value) values ('home_video_url', null)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- partner logos
-- ---------------------------------------------------------------------------
--
-- Logos get a bucket rather than a pasted external URL. `next/image` only
-- optimizes hosts named in `remotePatterns`, which is this project's own
-- storage — so an arbitrary logo URL would fail to render at all. Uploading
-- also means the homepage does not hotlink a third party's server.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('partners', 'partners', true, 2 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "logo partner dapat dibaca" on storage.objects for select
  using (bucket_id = 'partners');

-- Unlike the member buckets, this one is not per-user: whoever may manage
-- partners may manage their logos, and the row they belong to is shared.
create policy "admin & media kelola logo partner" on storage.objects for insert
  with check (bucket_id = 'partners' and (has_divisi('media') or is_admin()));

create policy "admin & media ganti logo partner" on storage.objects for update
  using (bucket_id = 'partners' and (has_divisi('media') or is_admin()))
  with check (bucket_id = 'partners' and (has_divisi('media') or is_admin()));

create policy "admin & media hapus logo partner" on storage.objects for delete
  using (bucket_id = 'partners' and (has_divisi('media') or is_admin()));
