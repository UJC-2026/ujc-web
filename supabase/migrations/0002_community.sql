-- Forum, events, workshops, blog, gallery, gamification.

create type vote_type as enum ('up', 'down');
create type rsvp_status as enum ('hadir', 'mungkin', 'tidak');
create type publish_status as enum ('draft', 'ditinjau', 'terbit');
create type workshop_type as enum ('workshop', 'seminar', 'webinar');
create type checkin_method as enum ('qr', 'kode');

-- ---------------------------------------------------------------------------
-- forum
-- ---------------------------------------------------------------------------

create table forum_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  sort_order int not null default 0
);

create table forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references forum_categories (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  view_count int not null default 0,
  reply_count int not null default 0,
  score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forum_threads_category_idx on forum_threads (category_id, created_at desc);
create index forum_threads_author_idx on forum_threads (author_id);
create index forum_threads_search_idx on forum_threads
  using gin (to_tsvector('simple', title || ' ' || content));

create table forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references forum_threads (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  parent_reply_id uuid references forum_replies (id) on delete cascade,
  content text not null,
  score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forum_replies_thread_idx on forum_replies (thread_id, created_at);

create table forum_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  thread_id uuid references forum_threads (id) on delete cascade,
  reply_id uuid references forum_replies (id) on delete cascade,
  vote vote_type not null,
  created_at timestamptz not null default now(),
  -- a vote targets exactly one of thread / reply
  constraint forum_votes_one_target check (num_nonnulls(thread_id, reply_id) = 1)
);

create unique index forum_votes_thread_unique_idx
  on forum_votes (user_id, thread_id) where thread_id is not null;
create unique index forum_votes_reply_unique_idx
  on forum_votes (user_id, reply_id) where reply_id is not null;

-- ---------------------------------------------------------------------------
-- events & workshops
-- ---------------------------------------------------------------------------

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  prefecture text,
  event_date timestamptz not null,
  is_online boolean not null default false,
  meeting_link text,
  cover_url text,
  capacity int,
  checkin_code text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index events_date_idx on events (event_date desc);

create table event_rsvp (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  status rsvp_status not null default 'hadir',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table event_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  method checkin_method not null default 'qr',
  checked_in_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  certificate_number text not null unique,
  pdf_url text,
  issued_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table workshops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type workshop_type not null default 'webinar',
  speaker text,
  scheduled_at timestamptz not null,
  meeting_link text,
  recording_url text,
  material_url text,
  capacity int,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (workshop_id, user_id)
);

-- ---------------------------------------------------------------------------
-- blog, gallery, resources, partners
-- ---------------------------------------------------------------------------

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  category text,
  tags text[] not null default '{}',
  status publish_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_idx on blog_posts (published_at desc)
  where status = 'terbit';

create table blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table blog_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table gallery_photos (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references profiles (id) on delete cascade,
  image_url text not null,
  caption text,
  is_homepage_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  file_url text,
  link text,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  description text,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- gamification
-- ---------------------------------------------------------------------------

create table user_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  points int not null,
  source text not null,
  created_at timestamptz not null default now()
);

create index user_points_user_idx on user_points (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table forum_categories enable row level security;
alter table forum_threads enable row level security;
alter table forum_replies enable row level security;
alter table forum_votes enable row level security;
alter table events enable row level security;
alter table event_rsvp enable row level security;
alter table event_checkins enable row level security;
alter table certificates enable row level security;
alter table workshops enable row level security;
alter table workshop_registrations enable row level security;
alter table blog_posts enable row level security;
alter table blog_comments enable row level security;
alter table blog_likes enable row level security;
alter table gallery_photos enable row level security;
alter table resources enable row level security;
alter table partners enable row level security;
alter table user_points enable row level security;

-- forum: public read, authenticated authors own their content, mods moderate.
create policy "kategori forum publik" on forum_categories for select using (true);
create policy "admin kelola kategori forum" on forum_categories for all
  using (is_admin()) with check (is_admin());

create policy "thread publik" on forum_threads for select using (true);
create policy "anggota buat thread" on forum_threads for insert
  with check (author_id = auth.uid());
create policy "penulis ubah threadnya" on forum_threads for update
  using (author_id = auth.uid() and not is_locked) with check (author_id = auth.uid());
create policy "penulis hapus threadnya" on forum_threads for delete
  using (author_id = auth.uid());
create policy "moderator kelola thread" on forum_threads for all
  using (is_moderator()) with check (is_moderator());

create policy "balasan publik" on forum_replies for select using (true);
create policy "anggota balas" on forum_replies for insert
  with check (author_id = auth.uid());
create policy "penulis ubah balasannya" on forum_replies for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "penulis hapus balasannya" on forum_replies for delete
  using (author_id = auth.uid());
create policy "moderator kelola balasan" on forum_replies for all
  using (is_moderator()) with check (is_moderator());

create policy "vote terlihat publik" on forum_votes for select using (true);
create policy "anggota kelola votenya" on forum_votes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- events & workshops: public read, divisi acara writes.
create policy "event publik" on events for select using (true);
create policy "divisi acara kelola event" on events for all
  using (has_divisi('acara') or is_admin())
  with check (has_divisi('acara') or is_admin());

create policy "rsvp terlihat pengurus & pemilik" on event_rsvp for select
  using (user_id = auth.uid() or is_pengurus());
create policy "anggota kelola rsvpnya" on event_rsvp for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "checkin terlihat pengurus & pemilik" on event_checkins for select
  using (user_id = auth.uid() or is_pengurus());
create policy "divisi acara kelola checkin" on event_checkins for all
  using (has_divisi('acara') or is_admin())
  with check (has_divisi('acara') or is_admin());

create policy "sertifikat terlihat pemilik & pengurus" on certificates for select
  using (user_id = auth.uid() or is_pengurus());
create policy "divisi acara terbitkan sertifikat" on certificates for all
  using (has_divisi('acara') or is_admin())
  with check (has_divisi('acara') or is_admin());

create policy "workshop publik" on workshops for select using (true);
create policy "divisi acara & pendidikan kelola workshop" on workshops for all
  using (has_divisi('acara', 'pendidikan') or is_admin())
  with check (has_divisi('acara', 'pendidikan') or is_admin());

create policy "pendaftaran workshop terlihat pemilik & pengurus"
  on workshop_registrations for select
  using (user_id = auth.uid() or is_pengurus());
create policy "anggota daftar workshop" on workshop_registrations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- blog: published posts are public, drafts stay with the author + media.
create policy "artikel terbit publik" on blog_posts for select
  using (status = 'terbit' or author_id = auth.uid() or has_divisi('media') or is_moderator());
create policy "anggota tulis artikel" on blog_posts for insert
  with check (author_id = auth.uid());
create policy "penulis ubah artikelnya" on blog_posts for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "divisi media kelola artikel" on blog_posts for all
  using (has_divisi('media') or is_moderator())
  with check (has_divisi('media') or is_moderator());

create policy "komentar artikel publik" on blog_comments for select using (true);
create policy "anggota komentari artikel" on blog_comments for insert
  with check (author_id = auth.uid());
create policy "penulis kelola komentarnya" on blog_comments for all
  using (author_id = auth.uid() or is_moderator())
  with check (author_id = auth.uid() or is_moderator());

create policy "like artikel publik" on blog_likes for select using (true);
create policy "anggota kelola likenya" on blog_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- gallery: members upload, but only admin/media control the homepage picks.
create policy "galeri publik" on gallery_photos for select using (true);
create policy "anggota unggah foto" on gallery_photos for insert
  with check (uploaded_by = auth.uid() and not is_homepage_featured);
create policy "pengunggah hapus fotonya" on gallery_photos for delete
  using (uploaded_by = auth.uid() and not is_homepage_featured);
create policy "media kelola galeri unggulan" on gallery_photos for all
  using (has_divisi('media') or is_admin())
  with check (has_divisi('media') or is_admin());

create policy "resource publik" on resources for select using (true);
create policy "divisi pendidikan kelola resource" on resources for all
  using (has_divisi('pendidikan') or is_admin())
  with check (has_divisi('pendidikan') or is_admin());

create policy "partner publik" on partners for select using (true);
create policy "admin & media kelola partner" on partners for all
  using (has_divisi('media') or is_admin())
  with check (has_divisi('media') or is_admin());

create policy "poin terlihat publik" on user_points for select using (true);
create policy "admin kelola poin" on user_points for all
  using (is_admin()) with check (is_admin());
