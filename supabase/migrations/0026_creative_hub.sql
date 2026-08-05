-- Creative hub: member-submitted works (video, foto, tulisan, musik) that the
-- media division curates into a public showcase.
--
-- The spec asks for a YouTube/Instagram/Facebook feed. Automated feeds need
-- API keys and app review; what ships instead is link-based curation, which
-- needs neither: YouTube thumbnails are served publicly per video id, and
-- other platforms get a styled card. The moderation gate is built the way
-- jobs (0014), blog (0017), and businesses (0024) had to be *fixed*: the
-- status column is guarded by a trigger from day one, because the table is
-- reachable directly through PostgREST.

create table creative_works (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 600),
  url text not null check (url ~* '^https?://'),
  platform text not null default 'lainnya'
    check (platform in ('youtube', 'instagram', 'tiktok', 'facebook', 'lainnya')),
  -- Derived from the URL by a trigger, never trusted from the client.
  youtube_id text,
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table creative_works enable row level security;

create policy "karya disetujui publik" on creative_works
  for select using (is_approved or submitted_by = auth.uid() or is_moderator());

create policy "anggota ajukan karya" on creative_works
  for insert with check (submitted_by = auth.uid());

create policy "pemilik kelola karyanya" on creative_works
  for update using (submitted_by = auth.uid())
  with check (submitted_by = auth.uid());

create policy "pemilik hapus karyanya" on creative_works
  for delete using (submitted_by = auth.uid() or is_moderator());

create policy "moderator kelola karya" on creative_works
  for update using (is_moderator()) with check (is_moderator());

grant select, insert, update, delete on creative_works to authenticated;
grant select on creative_works to anon;

/**
 * Normalises the row on write: detects the platform from the URL and extracts
 * the YouTube video id server-side, and refuses status flips from
 * non-moderators — the same shape previous modules needed patched in after
 * the gap was found by testing.
 */
create or replace function guard_creative_work()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  yt text;
begin
  -- Platform + thumbnail id are derived, not client-supplied.
  yt := coalesce(
    substring(new.url from 'youtube\.com/watch\?v=([A-Za-z0-9_-]{6,20})'),
    substring(new.url from 'youtu\.be/([A-Za-z0-9_-]{6,20})'),
    substring(new.url from 'youtube\.com/shorts/([A-Za-z0-9_-]{6,20})')
  );

  if yt is not null then
    new.platform := 'youtube';
    new.youtube_id := yt;
  elsif new.url ~* 'instagram\.com' then
    new.platform := 'instagram'; new.youtube_id := null;
  elsif new.url ~* 'tiktok\.com' then
    new.platform := 'tiktok'; new.youtube_id := null;
  elsif new.url ~* 'facebook\.com|fb\.watch' then
    new.platform := 'facebook'; new.youtube_id := null;
  else
    new.platform := 'lainnya'; new.youtube_id := null;
  end if;

  if is_moderator() or can_manage_pengurus_area() then
    return new;
  end if;

  if tg_op = 'INSERT' and (new.is_approved or new.is_featured) then
    raise exception 'Karya harus ditinjau pengurus dulu sebelum tampil.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (
    new.is_approved is distinct from old.is_approved
    or new.is_featured is distinct from old.is_featured
  ) then
    raise exception 'Hanya pengurus yang bisa mengubah status kurasi karya.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger creative_works_guard
  before insert or update on creative_works
  for each row execute function guard_creative_work();

create index creative_works_public_idx
  on creative_works (created_at desc) where is_approved;
