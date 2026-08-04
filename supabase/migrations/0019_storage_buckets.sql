-- No storage buckets existed, which is why every image field in the app
-- (avatar, foto barang, cover artikel, galeri, arsip dokumen) had nowhere to
-- write to.
--
-- Every bucket enforces its own size and MIME allowlist at the storage layer,
-- so a client cannot talk its way past them. Uploads are namespaced by uploader
-- — `{user_id}/{file}` — which is what lets the policies below check ownership
-- from the object path alone.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',     'avatars',     true,  2 * 1024 * 1024,
   array['image/jpeg','image/png','image/webp']),
  ('marketplace', 'marketplace', true,  5 * 1024 * 1024,
   array['image/jpeg','image/png','image/webp']),
  ('blog',        'blog',        true,  5 * 1024 * 1024,
   array['image/jpeg','image/png','image/webp']),
  ('gallery',     'gallery',     true,  5 * 1024 * 1024,
   array['image/jpeg','image/png','image/webp']),
  -- Organisation paperwork is not public.
  ('documents',   'documents',   false, 10 * 1024 * 1024,
   array['application/pdf','image/jpeg','image/png',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;

-- The first path segment is the uploader's id.
create or replace function storage_owns_path(object_name text)
returns boolean language sql stable set search_path = public as $$
  select coalesce((storage.foldername(object_name))[1] = auth.uid()::text, false);
$$;

-- ---------------------------------------------------------------------------
-- public buckets: anyone reads, members write only inside their own folder
-- ---------------------------------------------------------------------------

create policy "gambar publik dapat dibaca" on storage.objects for select
  using (bucket_id in ('avatars', 'marketplace', 'blog', 'gallery'));

create policy "anggota unggah gambarnya" on storage.objects for insert
  with check (
    bucket_id in ('avatars', 'marketplace', 'blog', 'gallery')
    and auth.uid() is not null
    and storage_owns_path(name)
  );

create policy "anggota ganti gambarnya" on storage.objects for update
  using (
    bucket_id in ('avatars', 'marketplace', 'blog', 'gallery')
    and storage_owns_path(name)
  )
  with check (
    bucket_id in ('avatars', 'marketplace', 'blog', 'gallery')
    and storage_owns_path(name)
  );

create policy "anggota hapus gambarnya" on storage.objects for delete
  using (
    bucket_id in ('avatars', 'marketplace', 'blog', 'gallery')
    and (storage_owns_path(name) or is_moderator())
  );

-- ---------------------------------------------------------------------------
-- documents: pengurus only, both directions
-- ---------------------------------------------------------------------------

create policy "pengurus baca dokumen" on storage.objects for select
  using (bucket_id = 'documents' and can_manage_pengurus_area());

create policy "pengurus unggah dokumen" on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and can_manage_pengurus_area()
    and storage_owns_path(name)
  );

create policy "pengurus hapus dokumen" on storage.objects for delete
  using (bucket_id = 'documents' and can_manage_pengurus_area());
