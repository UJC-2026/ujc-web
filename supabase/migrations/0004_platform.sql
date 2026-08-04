-- Direct messages, notifications, moderation queue, and the internal
-- pengurus workspace (finance, admin, proker, tasks, calendar, board).

create type report_status as enum ('menunggu', 'ditindak', 'ditolak');
create type flag_reason as enum ('scam', 'provokatif', 'dewasa', 'judol', 'lainnya');
create type flag_status as enum ('baru', 'ditinjau', 'disetujui', 'ditolak');
create type transaction_type as enum ('pemasukan', 'pengeluaran');
create type budget_status as enum ('diajukan', 'disetujui', 'ditolak');
create type program_status as enum ('rencana', 'berjalan', 'selesai', 'tertunda');
create type task_status as enum ('todo', 'dikerjakan', 'selesai');
create type task_priority as enum ('rendah', 'sedang', 'tinggi');
create type calendar_kind as enum ('rapat', 'event', 'deadline', 'penting');

-- ---------------------------------------------------------------------------
-- direct messages
-- ---------------------------------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  unique (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at desc);

create table user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

-- Membership check lives in a security definer function: querying
-- conversation_participants from its own policy would recurse.
create or replace function is_conversation_member(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = target and cp.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_unread_idx on notifications (user_id, created_at desc)
  where not is_read;

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  channel_inapp boolean not null default true,
  channel_email boolean not null default false,
  channel_push boolean not null default false,
  unique (user_id, type)
);

-- ---------------------------------------------------------------------------
-- moderation
-- ---------------------------------------------------------------------------

create table reports (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid not null,
  reporter_id uuid references profiles (id) on delete set null,
  reason text not null,
  status report_status not null default 'menunggu',
  created_at timestamptz not null default now()
);

create table content_flags (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid not null,
  reason flag_reason not null,
  flagged_by uuid references profiles (id) on delete set null,
  is_automatic boolean not null default true,
  status flag_status not null default 'baru',
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- pengurus workspace
-- ---------------------------------------------------------------------------

create table finance_transactions (
  id uuid primary key default gen_random_uuid(),
  type transaction_type not null,
  category text,
  amount int not null check (amount > 0),
  description text,
  event_id uuid references events (id) on delete set null,
  recorded_by uuid references profiles (id) on delete set null,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table event_budgets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id) on delete cascade,
  title text not null,
  requested_amount int not null check (requested_amount > 0),
  approved_amount int,
  status budget_status not null default 'diajukan',
  requested_by uuid references profiles (id) on delete set null,
  approved_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table member_dues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  period text not null,
  amount int not null,
  is_paid boolean not null default false,
  paid_at timestamptz,
  unique (user_id, period)
);

create table meeting_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  meeting_date date not null,
  created_by uuid references profiles (id) on delete set null,
  shared_with jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  file_url text not null,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  channel jsonb not null default '["inapp"]'::jsonb,
  sent_by uuid references profiles (id) on delete set null,
  sent_at timestamptz
);

create table content_calendar (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text,
  scheduled_at timestamptz not null,
  status text not null default 'rencana',
  assigned_to uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  divisi divisi not null,
  title text not null,
  description text,
  target text,
  start_date date,
  end_date date,
  pic_id uuid references profiles (id) on delete set null,
  budget int,
  status program_status not null default 'rencana',
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs (id) on delete set null,
  title text not null,
  description text,
  assigned_to uuid references profiles (id) on delete set null,
  created_by uuid references profiles (id) on delete set null,
  due_date date,
  priority task_priority not null default 'sedang',
  status task_status not null default 'todo',
  created_at timestamptz not null default now()
);

create index tasks_assignee_idx on tasks (assigned_to, status);

create table internal_calendar (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type calendar_kind not null default 'rapat',
  start_at timestamptz not null,
  end_at timestamptz,
  related_id uuid,
  created_by uuid references profiles (id) on delete set null
);

create table internal_board (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table internal_board_replies (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references internal_board (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table user_blocks enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table reports enable row level security;
alter table content_flags enable row level security;
alter table audit_logs enable row level security;
alter table finance_transactions enable row level security;
alter table event_budgets enable row level security;
alter table member_dues enable row level security;
alter table meeting_notes enable row level security;
alter table documents enable row level security;
alter table announcements enable row level security;
alter table content_calendar enable row level security;
alter table programs enable row level security;
alter table tasks enable row level security;
alter table internal_calendar enable row level security;
alter table internal_board enable row level security;
alter table internal_board_replies enable row level security;

create policy "peserta lihat percakapan" on conversations for select
  using (is_conversation_member(id));
create policy "anggota buat percakapan" on conversations for insert with check (true);

create policy "peserta lihat daftar peserta" on conversation_participants for select
  using (is_conversation_member(conversation_id));
create policy "anggota tambah peserta" on conversation_participants for insert
  with check (user_id = auth.uid() or is_conversation_member(conversation_id));

create policy "peserta baca pesan" on messages for select
  using (is_conversation_member(conversation_id));
create policy "peserta kirim pesan" on messages for insert
  with check (sender_id = auth.uid() and is_conversation_member(conversation_id));
create policy "pengirim ubah pesannya" on messages for update
  using (sender_id = auth.uid() or is_conversation_member(conversation_id))
  with check (is_conversation_member(conversation_id));

create policy "anggota kelola blokirnya" on user_blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy "anggota lihat notifikasinya" on notifications for select
  using (user_id = auth.uid());
create policy "anggota tandai notifikasinya" on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "anggota hapus notifikasinya" on notifications for delete
  using (user_id = auth.uid());

create policy "anggota kelola preferensi notifikasi" on notification_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "pelapor lihat laporannya" on reports for select
  using (reporter_id = auth.uid() or is_moderator());
create policy "anggota melapor" on reports for insert
  with check (reporter_id = auth.uid());
create policy "moderator kelola laporan" on reports for all
  using (is_moderator()) with check (is_moderator());

create policy "moderator kelola tanda konten" on content_flags for all
  using (is_moderator()) with check (is_moderator());

create policy "admin baca audit log" on audit_logs for select using (is_admin());

-- Division workspace pattern: the owning division writes, every other
-- pengurus reads. Ketua/wakil read everything via is_pengurus().
create policy "bendahara kelola kas" on finance_transactions for all
  using (has_divisi('bendahara') or is_admin())
  with check (has_divisi('bendahara') or is_admin());
create policy "pengurus lihat kas" on finance_transactions for select
  using (is_pengurus());

create policy "divisi acara ajukan anggaran" on event_budgets for insert
  with check (has_divisi('acara') and requested_by = auth.uid());
create policy "bendahara & pimpinan putuskan anggaran" on event_budgets for all
  using (has_divisi('bendahara') or is_pimpinan())
  with check (has_divisi('bendahara') or is_pimpinan());
create policy "pengurus lihat anggaran" on event_budgets for select
  using (is_pengurus());

create policy "bendahara kelola iuran" on member_dues for all
  using (has_divisi('bendahara') or is_admin())
  with check (has_divisi('bendahara') or is_admin());
create policy "anggota lihat iurannya" on member_dues for select
  using (user_id = auth.uid() or is_pengurus());

create policy "sekretaris kelola notulen" on meeting_notes for all
  using (has_divisi('sekretaris') or is_admin())
  with check (has_divisi('sekretaris') or is_admin());
create policy "pengurus lihat notulen" on meeting_notes for select
  using (is_pengurus());

create policy "sekretaris kelola dokumen" on documents for all
  using (has_divisi('sekretaris') or is_admin())
  with check (has_divisi('sekretaris') or is_admin());
create policy "pengurus lihat dokumen" on documents for select
  using (is_pengurus());

create policy "media kelola pengumuman" on announcements for all
  using (has_divisi('media') or is_admin())
  with check (has_divisi('media') or is_admin());
create policy "pengumuman terkirim publik" on announcements for select
  using (sent_at is not null or is_pengurus());

create policy "media kelola kalender konten" on content_calendar for all
  using (has_divisi('media') or is_admin())
  with check (has_divisi('media') or is_admin());
create policy "pengurus lihat kalender konten" on content_calendar for select
  using (is_pengurus());

create policy "divisi kelola prokernya" on programs for all
  using (has_divisi(divisi) or is_pimpinan())
  with check (has_divisi(divisi) or is_pimpinan());
create policy "pengurus lihat proker" on programs for select
  using (is_pengurus());

create policy "pengurus kelola tugas" on tasks for all
  using (is_pengurus()) with check (is_pengurus());

create policy "pengurus kelola kalender internal" on internal_calendar for all
  using (is_pengurus()) with check (is_pengurus());

create policy "pengurus baca papan internal" on internal_board for select
  using (is_pengurus());
create policy "pengurus tulis papan internal" on internal_board for insert
  with check (is_pengurus() and author_id = auth.uid());
create policy "penulis kelola papannya" on internal_board for all
  using (author_id = auth.uid() or is_pimpinan())
  with check (author_id = auth.uid() or is_pimpinan());

create policy "pengurus baca balasan papan" on internal_board_replies for select
  using (is_pengurus());
create policy "pengurus balas papan" on internal_board_replies for insert
  with check (is_pengurus() and author_id = auth.uid());
create policy "penulis kelola balasan papan" on internal_board_replies for all
  using (author_id = auth.uid() or is_pimpinan())
  with check (author_id = auth.uid() or is_pimpinan());
