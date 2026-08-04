-- UJC core identity: profiles, roles, kepengurusan, and the RLS helpers
-- every other migration builds on.

create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'moderator', 'member');
create type divisi as enum (
  'ketua', 'wakil', 'sekretaris', 'bendahara',
  'media', 'pendidikan', 'acara'
);
create type pengurus_status as enum ('aktif', 'alumni', 'cuti');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  nim text unique,
  kelas text,
  city text,
  prefecture text,
  major text,
  angkatan text,
  avatar_url text,
  cover_url text,
  bio text,
  motto text,
  social_links jsonb not null default '{}'::jsonb,
  role user_role not null default 'member',
  is_verified boolean not null default false,
  is_profile_public boolean not null default true,
  onboarded_at timestamptz,
  join_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_prefecture_idx on profiles (prefecture);
create index profiles_role_idx on profiles (role);

create table org_periods (
  id uuid primary key default gen_random_uuid(),
  year_label text not null unique,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only one period may be active at a time.
create unique index org_periods_single_active_idx
  on org_periods (is_active) where is_active;

create table pengurus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  divisi divisi not null,
  period_id uuid not null references org_periods (id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, divisi, period_id)
);

create index pengurus_user_active_idx on pengurus (user_id) where is_active;

-- Self-referencing hierarchy: Ketua -> Divisi -> anggota divisi.
create table org_positions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references org_periods (id) on delete cascade,
  parent_position_id uuid references org_positions (id) on delete cascade,
  name text not null,
  description text,
  cover_url text,
  sort_order int not null default 0
);

create index org_positions_period_idx on org_positions (period_id, sort_order);

create table org_members (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references org_positions (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  display_name text not null,
  photo_url text,
  motto text,
  city text,
  contact jsonb not null default '{}'::jsonb,
  status pengurus_status not null default 'aktif',
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- RLS helper functions
--
-- security definer so they can read `profiles` / `pengurus` without being
-- blocked by the very policies that call them (which would recurse).
-- ---------------------------------------------------------------------------

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('admin', 'moderator')
  );
$$;

-- True when the caller holds any active pengurus seat in the active period.
create or replace function is_pengurus()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pengurus g
    join org_periods o on o.id = g.period_id
    where g.user_id = auth.uid() and g.is_active and o.is_active
  );
$$;

-- True when the caller sits in one of the given divisions. Ketua and wakil are
-- deliberately NOT auto-included: they get read access everywhere via
-- is_pengurus(), but writes stay with the owning division.
create or replace function has_divisi(variadic targets divisi[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pengurus g
    join org_periods o on o.id = g.period_id
    where g.user_id = auth.uid()
      and g.is_active and o.is_active
      and g.divisi = any(targets)
  );
$$;

create or replace function is_pimpinan()
returns boolean language sql stable security definer set search_path = public as $$
  select has_divisi('ketua', 'wakil') or is_admin();
$$;

-- ---------------------------------------------------------------------------
-- new user -> profile
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

-- RLS grants row-level access but not column-level; without this a member
-- could escalate themselves to admin while editing their own profile.
create or replace function guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    new.role = old.role;
    new.is_verified = old.is_verified;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on profiles
  for each row execute function guard_profile_privileges();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table org_periods enable row level security;
alter table pengurus enable row level security;

create policy "profil publik dapat dibaca"
  on profiles for select
  using (is_profile_public or id = auth.uid() or is_moderator());

create policy "anggota mengubah profilnya sendiri"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin mengelola semua profil"
  on profiles for all
  using (is_admin())
  with check (is_admin());

create policy "periode kepengurusan dapat dibaca siapa saja"
  on org_periods for select using (true);

create policy "admin mengelola periode"
  on org_periods for all
  using (is_admin()) with check (is_admin());

create policy "daftar pengurus dapat dibaca siapa saja"
  on pengurus for select using (true);

create policy "admin mengelola pengurus"
  on pengurus for all
  using (is_admin()) with check (is_admin());

alter table org_positions enable row level security;
alter table org_members enable row level security;

create policy "struktur organisasi publik"
  on org_positions for select using (true);
create policy "admin mengelola struktur"
  on org_positions for all
  using (is_admin()) with check (is_admin());

create policy "anggota struktur publik"
  on org_members for select using (true);
create policy "admin mengelola anggota struktur"
  on org_members for all
  using (is_admin()) with check (is_admin());
