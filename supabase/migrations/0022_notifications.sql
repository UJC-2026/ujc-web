-- `notifications` has no insert policy, so every notification the server
-- actions tried to create was rejected by RLS. None of the calls checked the
-- error, so replying to a thread, assigning a task, or requesting mentoring
-- all appeared to work while the recipient was never told anything. Verified
-- before writing this: the table was empty and both inserts were refused.
--
-- Adding a client-callable insert policy would be the wrong fix — a member
-- could then forge "Ada balasan baru" from anyone. Notifications are raised by
-- triggers instead, so they can only describe something that actually
-- happened, and honour the recipient's in-app preference.

create or replace function notify_user(
  target uuid,
  kind text,
  title text,
  body text default null,
  link text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  -- Never notify someone about their own action, and never about nothing.
  if target is null or target = auth.uid() then
    return;
  end if;

  -- An explicit opt-out for this type wins; no row means the default (on).
  if exists (
    select 1 from notification_preferences p
    where p.user_id = target and p.type = kind and not p.channel_inapp
  ) then
    return;
  end if;

  insert into notifications (user_id, type, title, body, link)
  values (target, kind, title, body, link);
end;
$$;

-- ---------------------------------------------------------------------------
-- forum replies
-- ---------------------------------------------------------------------------

create or replace function notify_forum_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  thread forum_threads;
  slug text;
  recipient uuid;
begin
  select * into thread from forum_threads where id = new.thread_id;
  if thread is null then return null; end if;

  select c.slug into slug from forum_categories c where c.id = thread.category_id;

  -- A nested reply answers the parent author; a top-level one answers the
  -- thread author.
  if new.parent_reply_id is not null then
    select author_id into recipient from forum_replies where id = new.parent_reply_id;
  else
    recipient := thread.author_id;
  end if;

  perform notify_user(
    recipient, 'forum_reply', 'Ada balasan baru',
    format('Seseorang membalas di "%s".', thread.title),
    format('/forum/%s/%s', coalesce(slug, ''), thread.id)
  );
  return null;
end;
$$;

create trigger forum_replies_notify
  after insert on forum_replies
  for each row execute function notify_forum_reply();

-- ---------------------------------------------------------------------------
-- direct messages
-- ---------------------------------------------------------------------------

create or replace function notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recipient uuid;
begin
  for recipient in
    select cp.user_id from conversation_participants cp
    where cp.conversation_id = new.conversation_id and cp.user_id <> new.sender_id
  loop
    perform notify_user(
      recipient, 'pesan_baru', 'Pesan baru',
      left(new.content, 120),
      format('/messages/%s', new.conversation_id)
    );
  end loop;
  return null;
end;
$$;

create trigger messages_notify
  after insert on messages
  for each row execute function notify_new_message();

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create or replace function notify_task_assigned()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform notify_user(
    new.assigned_to, 'tugas_baru', 'Ada tugas baru untukmu',
    new.title, '/dashboard?panel=tugas'
  );
  return null;
end;
$$;

create trigger tasks_notify
  after insert on tasks
  for each row execute function notify_task_assigned();

-- ---------------------------------------------------------------------------
-- mentorship
-- ---------------------------------------------------------------------------

create or replace function notify_mentorship()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  mentor_user uuid;
begin
  select m.user_id into mentor_user from mentors m where m.id = new.mentor_id;

  if tg_op = 'INSERT' then
    perform notify_user(
      mentor_user, 'mentorship_request', 'Ada permintaan bimbingan baru',
      'Seorang anggota mengajukan bimbingan kepadamu.', '/mentorship'
    );
  elsif new.status is distinct from old.status then
    perform notify_user(
      new.mentee_id, 'mentorship_answer',
      case new.status
        when 'diterima' then 'Permintaan bimbinganmu diterima'
        when 'ditolak' then 'Permintaan bimbinganmu belum bisa diterima'
        else 'Bimbinganmu ditandai selesai'
      end,
      null, '/mentorship'
    );
  end if;
  return null;
end;
$$;

create trigger mentorship_requests_notify
  after insert or update on mentorship_requests
  for each row execute function notify_mentorship();

-- ---------------------------------------------------------------------------
-- internal board
-- ---------------------------------------------------------------------------

create or replace function notify_board_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post internal_board;
begin
  select * into post from internal_board where id = new.board_id;
  if post is null then return null; end if;

  perform notify_user(
    post.author_id, 'papan_balasan', 'Ada balasan di papan internal',
    format('Seseorang membalas "%s".', post.title), '/dashboard?panel=papan'
  );
  return null;
end;
$$;

create trigger internal_board_replies_notify
  after insert on internal_board_replies
  for each row execute function notify_board_reply();

create index if not exists notifications_user_unread_idx
  on notifications (user_id, created_at desc) where not is_read;
