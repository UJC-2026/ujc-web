-- Replacing an avatar, a cover, or a marketplace photo left the old file in
-- the bucket forever. That is a storage bill that only grows, and worse: an
-- image a member believed they had removed stays fetchable by anyone who
-- kept the URL, because these buckets are public.
--
-- Deleting a stored object has to go through the Storage API, which Postgres
-- cannot call. So the database does the part it is good at — noticing that a
-- file stopped being referenced — and records it. The app drains that queue.
--
-- Four properties this leans on, in order of how much damage their absence
-- would do:
--
-- 1. Only URLs that point at *this project's* public storage are ever
--    enqueued. Rows holding an external link are parsed to zero rows, so
--    nothing outside our own buckets can be named here at all.
-- 2. The queue only ever receives a value that was already stored on a row.
--    A file uploaded in one tab and not yet submitted was never on a row, so
--    it cannot be queued, and saving something else in another tab cannot
--    delete it.
-- 3. Nothing is deleted while any row still references it. Checked again at
--    sweep time, not at enqueue time, which is what makes an A → B → A swap
--    safe: A is queued when it goes, and skipped when it comes back.
-- 4. That check reads every row regardless of RLS. If it ran as the member,
--    references living in rows they cannot see would look like no reference
--    at all, and the sweep would delete files that are very much in use.
--
-- Two leaks this does not close. Files uploaded but never attached to a row
-- are invisible here by construction — property 2 is exactly the reason. And
-- when an account is deleted its rows cascade, queueing its images, but the
-- only person permitted to delete them no longer exists; clearing those needs
-- the service role, which not every deployment configures.

create table storage_orphans (
  bucket text not null,
  path text not null,
  detected_at timestamptz not null default now(),
  primary key (bucket, path)
);

alter table storage_orphans enable row level security;

create policy "admin lihat berkas yatim" on storage_orphans
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- parsing
-- ---------------------------------------------------------------------------

/**
 * Splits a public storage URL into its bucket and object path.
 *
 * Returns no rows for anything that is not one — an external logo, a null, a
 * pasted link. That emptiness is property 1 above: it is the reason a row
 * pointing somewhere else can never put a name into the queue.
 */
create or replace function storage_public_ref(url text)
returns table (bucket text, path text)
language sql immutable set search_path = public as $$
  select split_part(tail, '/', 1),
         substr(tail, length(split_part(tail, '/', 1)) + 2)
  from (
    select split_part(
             split_part(coalesce(url, ''), '?', 1),
             '/storage/v1/object/public/', 2
           ) as tail
  ) s
  where s.tail <> '' and position('/' in s.tail) > 0;
$$;

/** A text column and a jsonb array of URLs, flattened to the same shape. */
create or replace function storage_urls(value jsonb)
returns text[] language sql immutable set search_path = public as $$
  select case
    when value is null or jsonb_typeof(value) = 'null' then '{}'::text[]
    when jsonb_typeof(value) = 'array' then array(select jsonb_array_elements_text(value))
    when jsonb_typeof(value) = 'string' then array[value #>> '{}']
    else '{}'::text[]
  end;
$$;

-- ---------------------------------------------------------------------------
-- noticing
-- ---------------------------------------------------------------------------

/**
 * Records every image this row stopped pointing at.
 *
 * One function for all of them: the columns come in as trigger arguments, so
 * a table that grows an image column later needs a trigger, not another copy
 * of this logic.
 */
create or replace function track_storage_orphans()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  col text;
  before_urls text[] := '{}';
  after_urls text[] := '{}';
  o jsonb := to_jsonb(old);
  n jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
begin
  foreach col in array tg_argv loop
    before_urls := before_urls || storage_urls(o -> col);
    after_urls := after_urls || storage_urls(n -> col);
  end loop;

  insert into storage_orphans (bucket, path)
  select r.bucket, r.path
  from unnest(before_urls) u, lateral storage_public_ref(u) r
  where not (u = any (after_urls))
  on conflict do nothing;

  return null;
end;
$$;

create trigger profiles_storage_orphans after update or delete on profiles
  for each row execute function track_storage_orphans('avatar_url', 'cover_url');

create trigger marketplace_items_storage_orphans
  after update or delete on marketplace_items
  for each row execute function track_storage_orphans('images');

create trigger blog_posts_storage_orphans after update or delete on blog_posts
  for each row execute function track_storage_orphans('cover_image');

create trigger gallery_photos_storage_orphans
  after update or delete on gallery_photos
  for each row execute function track_storage_orphans('image_url');

create trigger businesses_storage_orphans after update or delete on businesses
  for each row execute function track_storage_orphans('images');

create trigger partners_storage_orphans after update or delete on partners
  for each row execute function track_storage_orphans('logo_url');

create trigger events_storage_orphans after update or delete on events
  for each row execute function track_storage_orphans('cover_url');

create trigger org_members_storage_orphans after update or delete on org_members
  for each row execute function track_storage_orphans('photo_url');

create trigger org_positions_storage_orphans
  after update or delete on org_positions
  for each row execute function track_storage_orphans('cover_url');

-- ---------------------------------------------------------------------------
-- sweeping
-- ---------------------------------------------------------------------------

/**
 * Every image any row currently points at.
 *
 * SECURITY DEFINER is load-bearing, not defensive habit: this is the list that
 * decides what survives, and a member cannot see other members' unpublished
 * drafts, hidden businesses, or private profiles. Reading it as them would
 * report their images as unreferenced and delete them.
 *
 * Deliberately not granted to authenticated — it is only ever consulted from
 * the function below.
 */
create or replace function storage_referenced()
returns table (bucket text, path text)
language sql stable security definer set search_path = public as $$
  with urls as (
    select avatar_url as u from profiles
    union all select cover_url from profiles
    union all select cover_url from events
    union all select cover_url from org_positions
    union all select photo_url from org_members
    union all select logo_url from partners
    union all select image_url from gallery_photos
    union all select cover_image from blog_posts
    union all select jsonb_array_elements_text(images) from marketplace_items
    union all select jsonb_array_elements_text(images) from businesses
  )
  select r.bucket, r.path
  from urls, lateral storage_public_ref(urls.u) r;
$$;

/**
 * Orphans the caller is allowed to delete and that nothing points at any more.
 *
 * Scoped to the caller's own folder because that is exactly what the bucket
 * delete policies permit — uploads live under `{user_id}/`. So members tidy up
 * after themselves on their next save, with no scheduler and no service key,
 * the same way auctions close on the next visit.
 */
create or replace function storage_orphans_ready()
returns table (bucket text, path text)
language sql stable security definer set search_path = public as $$
  select o.bucket, o.path
  from storage_orphans o
  where auth.uid() is not null
    and starts_with(o.path, auth.uid()::text || '/')
    and not exists (
      select 1 from storage_referenced() r
      where r.bucket = o.bucket and r.path = o.path
    )
  limit 50;
$$;

/** Forgets queue rows once their objects are actually gone from the bucket. */
create or replace function storage_orphans_clear(p_bucket text, p_paths text[])
returns int language plpgsql security definer set search_path = public as $$
declare
  removed int;
begin
  if auth.uid() is null then
    return 0;
  end if;

  delete from storage_orphans
  where bucket = p_bucket
    and path = any (p_paths)
    -- Same fence as the read: nobody clears a queue entry that was never
    -- theirs to delete in the first place.
    and starts_with(path, auth.uid()::text || '/');

  get diagnostics removed = row_count;
  return removed;
end;
$$;

grant execute on function storage_orphans_ready() to authenticated;
grant execute on function storage_orphans_clear(text, text[]) to authenticated;
