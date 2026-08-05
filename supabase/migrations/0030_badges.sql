-- Badges: the part of the gamification the spec asks for that 0020 never got to.
--
-- Points, levels, and the leaderboard all work. What is missing is the thing
-- that actually names an achievement — "kamu sudah menulis artikel pertamamu"
-- reads very differently from a counter going up by 15.
--
-- Two decisions shape everything below.
--
-- The criteria live in SQL here rather than as rows in the catalogue. A
-- data-driven rule engine would mean inventing a small language and an
-- interpreter for it, to express a dozen thresholds that are perfectly clear
-- as `count(*) >= 10`. The catalogue table therefore carries presentation
-- only: name, description, icon, tier.
--
-- And the whole thing is re-derived rather than incremented. `sync_badges()`
-- asks "what does this member qualify for now" and inserts what is missing, so
-- it can be run any number of times. Adding a badge later means a catalogue
-- row and a branch in the function — but no backfill script, because every
-- member picks it up the next time they earn a point, and the one-off
-- `select sync_badges(id) from profiles` at the bottom of this file catches
-- everyone who was already eligible.

create table badges (
  slug text primary key,
  name text not null,
  description text not null,
  -- lucide-react icon name; the UI maps it through an explicit allowlist.
  icon text not null,
  tier text not null default 'perunggu'
    check (tier in ('perunggu', 'perak', 'emas')),
  sort_order int not null default 0
);

create table user_badges (
  user_id uuid not null references profiles (id) on delete cascade,
  badge_slug text not null references badges (slug) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_slug)
);

alter table badges enable row level security;
alter table user_badges enable row level security;

create policy "katalog lencana publik" on badges for select using (true);

-- Mirrors how the leaderboard treats a hidden profile: a member who has opted
-- out of being listed publicly does not get their achievements listed either.
create policy "lencana mengikuti privasi profil" on user_badges for select
  using (
    user_id = auth.uid()
    or is_moderator()
    or exists (
      select 1 from profiles p
      where p.id = user_id and p.is_profile_public
    )
  );

-- Deliberately no insert/update/delete policy for anyone: badges are earned,
-- never granted, and `sync_badges()` runs as definer.
grant select on badges to anon, authenticated;
grant select on user_badges to anon, authenticated;

insert into badges (slug, name, description, icon, tier, sort_order) values
  ('forum-pertama',  'Salam pertama',      'Membuka thread pertama di forum.',                 'MessageCircle',  'perunggu', 10),
  ('forum-rutin',    'Tukang diskusi',     'Membuka 10 thread di forum.',                      'MessagesSquare', 'perak',    11),
  ('forum-penjawab', 'Suka menolong',      'Menulis 25 balasan untuk anggota lain.',           'HelpingHand',    'perak',    12),
  ('cbt-pertama',    'Mulai berlatih',     'Menyelesaikan satu latihan CBT.',                  'PenLine',        'perunggu', 20),
  ('cbt-rajin',      'Rajin berlatih',     'Menyelesaikan 10 latihan CBT.',                    'Repeat',         'perak',    21),
  ('cbt-cemerlang',  'Nyaris sempurna',    'Meraih skor 90% atau lebih di satu latihan CBT.',  'Sparkles',       'emas',     22),
  ('penulis',        'Penulis',            'Menerbitkan artikel pertama di blog komunitas.',   'FileText',       'perunggu', 30),
  ('penulis-tetap',  'Penulis tetap',      'Menerbitkan 5 artikel di blog komunitas.',         'Library',        'emas',     31),
  ('hadir-pertama',  'Datang juga',        'Tercatat hadir di satu kegiatan UJC.',             'CalendarCheck',  'perunggu', 40),
  ('hadir-setia',    'Wajah yang dikenal', 'Tercatat hadir di 5 kegiatan UJC.',                'Users',          'perak',    41),
  ('dermawan',       'Tangan di atas',     'Ikut menyumbang lewat UJC Peduli.',                'HeartHandshake', 'perunggu', 50),
  ('karya-tampil',   'Karya tayang',       'Punya karya yang lolos kurasi di Creative Hub.',   'Palette',        'perak',    60),
  ('poin-500',       'Lima ratus',         'Mengumpulkan 500 poin aktivitas.',                 'Trophy',         'emas',     70)
on conflict (slug) do nothing;

/**
 * Grants every badge the member currently qualifies for, and returns how many
 * were new.
 *
 * The primary key on (user_id, badge_slug) plus `on conflict do nothing` is
 * what makes this safe to call on every single point award: re-running it is a
 * no-op, so nobody is congratulated twice for the same badge.
 *
 * The notification is inserted directly rather than through `notify_user()`,
 * which returns early when the target is the caller. Here the caller is almost
 * always the member who just earned the thing — they are exactly who needs to
 * be told, and routing this through `notify_user()` would silently drop nearly
 * every badge notification the app will ever send.
 */
create or replace function sync_badges(target uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  earned text[];
  granted integer := 0;
  -- Not named `slug`: that collides with badges.slug inside the notification
  -- insert below, and PL/pgSQL calls the ambiguity an error rather than guessing.
  v_slug text;
begin
  if target is null then
    return 0;
  end if;

  select array_agg(b.slug) into earned
  from (
    select 'forum-pertama' as slug
      where (select count(*) from forum_threads where author_id = target) >= 1
    union all
    select 'forum-rutin'
      where (select count(*) from forum_threads where author_id = target) >= 10
    union all
    select 'forum-penjawab'
      where (select count(*) from forum_replies where author_id = target) >= 25
    union all
    select 'cbt-pertama'
      where (select count(*) from cbt_attempts
             where user_id = target and finished_at is not null) >= 1
    union all
    select 'cbt-rajin'
      where (select count(*) from cbt_attempts
             where user_id = target and finished_at is not null) >= 10
    union all
    select 'cbt-cemerlang'
      where exists (
        select 1 from cbt_attempts
        where user_id = target and finished_at is not null
          and total_questions > 0
          and score::numeric / total_questions >= 0.9
      )
    union all
    select 'penulis'
      where (select count(*) from blog_posts
             where author_id = target and status = 'terbit') >= 1
    union all
    select 'penulis-tetap'
      where (select count(*) from blog_posts
             where author_id = target and status = 'terbit') >= 5
    union all
    select 'hadir-pertama'
      where (select count(*) from event_checkins where user_id = target) >= 1
    union all
    select 'hadir-setia'
      where (select count(*) from event_checkins where user_id = target) >= 5
    union all
    select 'dermawan'
      where exists (select 1 from peduli_donations where donor_id = target)
    union all
    select 'karya-tampil'
      where exists (
        select 1 from creative_works
        where submitted_by = target and is_approved
      )
    union all
    select 'poin-500'
      where coalesce(
        (select sum(points) from user_points where user_id = target), 0
      ) >= 500
  ) b;

  if earned is null then
    return 0;
  end if;

  foreach v_slug in array earned loop
    insert into user_badges (user_id, badge_slug)
    values (target, v_slug)
    on conflict do nothing;

    if found then
      granted := granted + 1;

      insert into notifications (user_id, type, title, body, link)
      select target, 'lencana_baru',
             'Lencana baru: ' || b.name,
             b.description,
             '/members/' || target
      from badges b
      where b.slug = v_slug
        and not exists (
          select 1 from notification_preferences p
          where p.user_id = target and p.type = 'lencana_baru'
            and not p.channel_inapp
        );
    end if;
  end loop;

  return granted;
end;
$$;

grant execute on function sync_badges(uuid) to authenticated;

/**
 * Every badge criterion is downstream of something that also awards points, so
 * hanging the re-check off `award_points()` covers all of them with one hook
 * instead of a trigger per table that would have to be remembered each time a
 * new source of points is added.
 */
create or replace function award_points(
  target uuid,
  amount int,
  reason text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if target is null or amount = 0 then
    return;
  end if;
  insert into user_points (user_id, points, source) values (target, amount, reason);
  perform sync_badges(target);
end;
$$;

-- Existing members have already done the qualifying work; without this their
-- badges would only appear the next time they happened to earn a point.
select sync_badges(id) from profiles;
