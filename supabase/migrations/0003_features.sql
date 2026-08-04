-- Marketplace, CBT, jobs, mentorship, UJC Peduli, business directory,
-- member map, AI study assistant.

create type item_status as enum ('tersedia', 'dipesan', 'terjual');
create type cbt_type as enum ('jlpt', 'ssw');
create type job_save_status as enum ('disimpan', 'dilamar');
create type mentorship_status as enum ('menunggu', 'diterima', 'ditolak', 'selesai');
create type peduli_status as enum ('pengajuan', 'diverifikasi', 'berjalan', 'selesai');
create type chat_role as enum ('user', 'assistant');

-- ---------------------------------------------------------------------------
-- marketplace
-- ---------------------------------------------------------------------------

create table marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  category text,
  condition text,
  price int,
  is_giveaway boolean not null default false,
  images jsonb not null default '[]'::jsonb,
  city text,
  prefecture text,
  status item_status not null default 'tersedia',
  is_auction boolean not null default false,
  auction_end_at timestamptz,
  created_at timestamptz not null default now(),
  -- an auction needs an end time; a giveaway must not carry a price
  constraint marketplace_auction_needs_end
    check (not is_auction or auction_end_at is not null),
  constraint marketplace_giveaway_is_free
    check (not is_giveaway or price is null or price = 0)
);

create index marketplace_items_status_idx on marketplace_items (status, created_at desc);

create table marketplace_bids (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references marketplace_items (id) on delete cascade,
  bidder_id uuid not null references profiles (id) on delete cascade,
  amount int not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index marketplace_bids_item_idx on marketplace_bids (item_id, amount desc);

-- ---------------------------------------------------------------------------
-- CBT
-- ---------------------------------------------------------------------------

create table cbt_test_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type cbt_type not null,
  level text,
  description text,
  duration_minutes int not null default 60,
  is_published boolean not null default false
);

create table cbt_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references cbt_test_categories (id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  sort_order int not null default 0
);

create table cbt_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  category_id uuid not null references cbt_test_categories (id) on delete cascade,
  score int,
  total_questions int,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index cbt_attempts_user_idx on cbt_attempts (user_id, started_at desc);

create table cbt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references cbt_attempts (id) on delete cascade,
  question_id uuid not null references cbt_questions (id) on delete cascade,
  selected_answer text,
  is_correct boolean,
  unique (attempt_id, question_id)
);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------

create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location_prefecture text,
  salary_min int,
  salary_max int,
  contract_type text,
  visa_types jsonb not null default '[]'::jsonb,
  deadline date,
  description text,
  requirements text,
  posted_by uuid references profiles (id) on delete set null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index jobs_prefecture_idx on jobs (location_prefecture, created_at desc);

create table job_saves (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  status job_save_status not null default 'disimpan',
  created_at timestamptz not null default now(),
  unique (job_id, user_id)
);

-- ---------------------------------------------------------------------------
-- mentorship
-- ---------------------------------------------------------------------------

create table mentors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles (id) on delete cascade,
  expertise jsonb not null default '[]'::jsonb,
  city text,
  experience_summary text,
  is_available boolean not null default true,
  capacity int not null default 3,
  created_at timestamptz not null default now()
);

create table mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentors (id) on delete cascade,
  mentee_id uuid not null references profiles (id) on delete cascade,
  message text,
  status mentorship_status not null default 'menunggu',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- UJC Peduli
-- ---------------------------------------------------------------------------

create table peduli_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  target_amount int,
  collected_amount int not null default 0,
  status peduli_status not null default 'pengajuan',
  is_public boolean not null default false,
  submitted_by uuid references profiles (id) on delete set null,
  verified_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table peduli_donations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references peduli_cases (id) on delete cascade,
  donor_id uuid references profiles (id) on delete set null,
  amount int not null check (amount > 0),
  is_anonymous boolean not null default false,
  message text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- business directory, member map, AI assistant
-- ---------------------------------------------------------------------------

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  category text,
  description text,
  contact text,
  city text,
  images jsonb not null default '[]'::jsonb,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table member_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles (id) on delete cascade,
  prefecture text not null,
  city text,
  lat double precision,
  lng double precision,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references ai_chat_sessions (id) on delete cascade,
  role chat_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table marketplace_items enable row level security;
alter table marketplace_bids enable row level security;
alter table cbt_test_categories enable row level security;
alter table cbt_questions enable row level security;
alter table cbt_attempts enable row level security;
alter table cbt_answers enable row level security;
alter table jobs enable row level security;
alter table job_saves enable row level security;
alter table mentors enable row level security;
alter table mentorship_requests enable row level security;
alter table peduli_cases enable row level security;
alter table peduli_donations enable row level security;
alter table businesses enable row level security;
alter table member_locations enable row level security;
alter table ai_chat_sessions enable row level security;
alter table ai_chat_messages enable row level security;

create policy "barang publik" on marketplace_items for select using (true);
create policy "penjual kelola barangnya" on marketplace_items for all
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "moderator kelola barang" on marketplace_items for all
  using (is_moderator()) with check (is_moderator());

create policy "tawaran terlihat publik" on marketplace_bids for select using (true);
create policy "anggota menawar" on marketplace_bids for insert
  with check (bidder_id = auth.uid());
create policy "moderator kelola tawaran" on marketplace_bids for all
  using (is_moderator()) with check (is_moderator());

-- CBT: questions stay hidden from members so answers can't be scraped; the
-- app reads them through a server-side service role during an attempt.
create policy "kategori tes terbit publik" on cbt_test_categories for select
  using (is_published or has_divisi('pendidikan') or is_admin());
create policy "divisi pendidikan kelola kategori tes" on cbt_test_categories for all
  using (has_divisi('pendidikan') or is_admin())
  with check (has_divisi('pendidikan') or is_admin());

create policy "divisi pendidikan kelola bank soal" on cbt_questions for all
  using (has_divisi('pendidikan') or is_admin())
  with check (has_divisi('pendidikan') or is_admin());

create policy "anggota lihat percobaannya" on cbt_attempts for select
  using (user_id = auth.uid() or has_divisi('pendidikan') or is_admin());
create policy "anggota kelola percobaannya" on cbt_attempts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "anggota kelola jawabannya" on cbt_answers for all
  using (exists (
    select 1 from cbt_attempts a
    where a.id = cbt_answers.attempt_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from cbt_attempts a
    where a.id = cbt_answers.attempt_id and a.user_id = auth.uid()
  ));

create policy "lowongan terverifikasi publik" on jobs for select
  using (is_verified or posted_by = auth.uid() or is_moderator());
create policy "pengurus posting lowongan" on jobs for insert
  with check (is_pengurus() and posted_by = auth.uid());
create policy "moderator kelola lowongan" on jobs for all
  using (is_moderator()) with check (is_moderator());

create policy "anggota kelola lowongan tersimpan" on job_saves for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "mentor publik" on mentors for select using (true);
create policy "mentor kelola profilnya" on mentors for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "permintaan mentoring terlihat pihak terkait"
  on mentorship_requests for select
  using (
    mentee_id = auth.uid()
    or exists (select 1 from mentors m where m.id = mentor_id and m.user_id = auth.uid())
    or has_divisi('pendidikan') or is_admin()
  );
create policy "anggota ajukan mentoring" on mentorship_requests for insert
  with check (mentee_id = auth.uid());
create policy "mentor jawab permintaan" on mentorship_requests for update
  using (exists (select 1 from mentors m where m.id = mentor_id and m.user_id = auth.uid()))
  with check (exists (select 1 from mentors m where m.id = mentor_id and m.user_id = auth.uid()));

-- Peduli cases are private until an admin verifies and publishes them, to
-- protect the member who asked for help.
create policy "kasus peduli publik setelah diverifikasi" on peduli_cases for select
  using (is_public or submitted_by = auth.uid() or is_pimpinan() or has_divisi('bendahara'));
create policy "anggota ajukan bantuan" on peduli_cases for insert
  with check (submitted_by = auth.uid() and not is_public and status = 'pengajuan');
create policy "pimpinan kelola kasus peduli" on peduli_cases for all
  using (is_pimpinan()) with check (is_pimpinan());

create policy "donasi terlihat donatur & bendahara" on peduli_donations for select
  using (donor_id = auth.uid() or has_divisi('bendahara') or is_pimpinan());
create policy "anggota berdonasi" on peduli_donations for insert
  with check (donor_id = auth.uid());
create policy "bendahara kelola donasi" on peduli_donations for all
  using (has_divisi('bendahara') or is_pimpinan())
  with check (has_divisi('bendahara') or is_pimpinan());

create policy "bisnis terverifikasi publik" on businesses for select
  using (is_verified or owner_id = auth.uid() or is_moderator());
create policy "pemilik kelola bisnisnya" on businesses for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "moderator verifikasi bisnis" on businesses for all
  using (is_moderator()) with check (is_moderator());

create policy "lokasi anggota yang bersedia tampil" on member_locations for select
  using (is_visible or user_id = auth.uid() or is_admin());
create policy "anggota kelola lokasinya" on member_locations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "anggota kelola sesi ai" on ai_chat_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "anggota kelola pesan ai" on ai_chat_messages for all
  using (exists (
    select 1 from ai_chat_sessions s
    where s.id = ai_chat_messages.session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from ai_chat_sessions s
    where s.id = ai_chat_messages.session_id and s.user_id = auth.uid()
  ));
