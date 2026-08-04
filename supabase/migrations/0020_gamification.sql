-- user_points is read-public and write-admin-only, which correctly stops a
-- member from awarding themselves points — but nothing else ever wrote to it
-- either. Every level, progress bar, and leaderboard in the app therefore read
-- zero no matter how active someone was.
--
-- Points are now granted by triggers running as SECURITY DEFINER, so the
-- table stays closed to clients while the app still fills it.

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
end;
$$;

-- ---------------------------------------------------------------------------
-- forum
-- ---------------------------------------------------------------------------

create or replace function points_for_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.author_id, 10, 'forum.thread');
  return null;
end;
$$;

create trigger forum_threads_award_points
  after insert on forum_threads
  for each row execute function points_for_thread();

create or replace function points_for_reply()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.author_id, 5, 'forum.balasan');
  return null;
end;
$$;

create trigger forum_replies_award_points
  after insert on forum_replies
  for each row execute function points_for_reply();

-- ---------------------------------------------------------------------------
-- CBT
--
-- Only the first completed attempt per category earns points. Without that,
-- retaking the same test would be the fastest way to farm the leaderboard,
-- which is the opposite of what the points are meant to encourage.
-- ---------------------------------------------------------------------------

create or replace function points_for_cbt()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  earlier int;
  earned int;
begin
  if new.finished_at is null or old.finished_at is not null then
    return null;
  end if;

  select count(*) into earlier
  from cbt_attempts
  where user_id = new.user_id
    and category_id = new.category_id
    and finished_at is not null
    and id <> new.id;

  if earlier > 0 then
    return null;
  end if;

  -- 2 points per correct answer, plus a bonus for a clean sweep.
  earned := coalesce(new.score, 0) * 2;
  if new.total_questions > 0 and new.score = new.total_questions then
    earned := earned + 10;
  end if;

  perform award_points(new.user_id, earned, 'cbt.selesai');
  return null;
end;
$$;

create trigger cbt_attempts_award_points
  after update on cbt_attempts
  for each row execute function points_for_cbt();

-- ---------------------------------------------------------------------------
-- blog & kehadiran
-- ---------------------------------------------------------------------------

create or replace function points_for_published_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'terbit' and old.status is distinct from 'terbit' then
    perform award_points(new.author_id, 25, 'blog.terbit');
  end if;
  return null;
end;
$$;

create trigger blog_posts_award_points
  after update on blog_posts
  for each row execute function points_for_published_post();

create or replace function points_for_checkin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.user_id, 15, 'kegiatan.hadir');
  return null;
end;
$$;

create trigger event_checkins_award_points
  after insert on event_checkins
  for each row execute function points_for_checkin();

-- ---------------------------------------------------------------------------
-- leaderboard
--
-- Members who hid their profile are left out: appearing on a public ranking
-- is exactly the kind of exposure that setting is meant to prevent.
-- ---------------------------------------------------------------------------

create or replace function points_leaderboard(since timestamptz default null)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  total_points bigint
) language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.avatar_url, sum(up.points)::bigint
  from user_points up
  join profiles p on p.id = up.user_id
  where p.is_profile_public
    and (since is null or up.created_at >= since)
  group by p.id, p.full_name, p.avatar_url
  having sum(up.points) > 0
  order by sum(up.points) desc, p.full_name
  limit 20;
$$;

grant execute on function points_leaderboard(timestamptz) to anon, authenticated;

-- Backfill so existing seeded activity is not invisible on the leaderboard.
insert into user_points (user_id, points, source)
select author_id, 10, 'forum.thread' from forum_threads
union all
select author_id, 5, 'forum.balasan' from forum_replies;
