-- Direct messaging had three problems, all stemming from conversation
-- membership being managed by the client:
--
-- 1. UNUSABLE. `conversations` can be inserted but its select policy requires
--    membership, and membership cannot exist until the row is created. The
--    client therefore never learns the new conversation's id.
--
-- 2. PRIVACY HOLE. The participant insert policy allowed
--    `user_id = auth.uid()`, so any signed-in member could add *themselves* to
--    any conversation and then read the whole private thread.
--
-- 3. TAMPERING. The message update policy allowed any participant to update
--    any message, so one side could silently rewrite what the other had said.
--    The intent was clearly to let the recipient set read_at.
--
-- Creating a conversation is now a single atomic RPC, joining one yourself is
-- gone, editing is limited to your own messages, and marking as read has its
-- own narrow function.

-- ---------------------------------------------------------------------------
-- 1 + 2: conversation creation
-- ---------------------------------------------------------------------------

drop policy if exists "anggota tambah peserta" on conversation_participants;

-- Only someone already in the conversation may pull another member in
-- (group chats later); nobody can add themselves.
create policy "peserta tambah peserta lain" on conversation_participants
  for insert with check (is_conversation_member(conversation_id));

-- Returns the existing one-to-one conversation with `other_user`, or creates
-- it. SECURITY DEFINER so it can seed both participant rows atomically.
create or replace function start_direct_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  existing uuid;
  fresh uuid;
begin
  if me is null then
    raise exception 'Masuk dulu untuk mengirim pesan.' using errcode = '42501';
  end if;

  if other_user = me then
    raise exception 'Tidak bisa memulai percakapan dengan diri sendiri.'
      using errcode = '22023';
  end if;

  if not exists (select 1 from profiles where id = other_user) then
    raise exception 'Anggota tidak ditemukan.' using errcode = '23503';
  end if;

  -- Blocking is mutual: neither side can open a thread with the other.
  if exists (
    select 1 from user_blocks
    where (blocker_id = me and blocked_id = other_user)
       or (blocker_id = other_user and blocked_id = me)
  ) then
    raise exception 'Percakapan tidak bisa dimulai dengan anggota ini.'
      using errcode = '42501';
  end if;

  -- A one-to-one thread is one with exactly these two participants.
  select cp.conversation_id into existing
  from conversation_participants cp
  where cp.user_id in (me, other_user)
  group by cp.conversation_id
  having count(*) filter (where cp.user_id in (me, other_user)) = 2
     and count(*) = 2
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into conversations default values returning id into fresh;
  insert into conversation_participants (conversation_id, user_id)
  values (fresh, me), (fresh, other_user);

  return fresh;
end;
$$;

revoke execute on function start_direct_conversation(uuid) from anon;
grant execute on function start_direct_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3: message editing and read receipts
-- ---------------------------------------------------------------------------

drop policy if exists "pengirim ubah pesannya" on messages;

create policy "pengirim ubah pesannya" on messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create policy "pengirim hapus pesannya" on messages for delete
  using (sender_id = auth.uid());

-- The recipient still needs to mark a thread read, which the policy above
-- deliberately no longer permits. This does that one thing and nothing else.
create or replace function mark_conversation_read(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_conversation_member(target) then
    raise exception 'Percakapan tidak ditemukan.' using errcode = '42501';
  end if;

  update messages
    set read_at = now()
    where conversation_id = target
      and sender_id <> auth.uid()
      and read_at is null;
end;
$$;

revoke execute on function mark_conversation_read(uuid) from anon;
grant execute on function mark_conversation_read(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- blocking also stops messages in an existing thread
-- ---------------------------------------------------------------------------

create or replace function reject_blocked_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1
    from conversation_participants cp
    join user_blocks b
      on (b.blocker_id = cp.user_id and b.blocked_id = new.sender_id)
      or (b.blocker_id = new.sender_id and b.blocked_id = cp.user_id)
    where cp.conversation_id = new.conversation_id
      and cp.user_id <> new.sender_id
  ) then
    raise exception 'Pesan tidak bisa dikirim ke anggota ini.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger messages_reject_blocked
  before insert on messages
  for each row execute function reject_blocked_message();

-- Conversation rows themselves are never read directly by the app any more,
-- but keep the select policy honest for anyone who does.
create index if not exists messages_conversation_created_idx
  on messages (conversation_id, created_at desc);
