-- audit_logs had a select policy for admins but no insert policy at all, so
-- every write from a moderator action was rejected by RLS. The calling code
-- did not check the error, so pin/unpin appeared to work while the
-- accountability trail silently recorded nothing.
--
-- Writes now go through a SECURITY DEFINER function that stamps actor_id from
-- auth.uid() itself. That fixes the rejection and also means an actor cannot
-- be forged by passing someone else's id from the client.

create or replace function log_audit(
  p_action text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public as $$
begin
  -- Only staff may write to the trail; anonymous callers are ignored.
  if not (is_moderator() or is_pengurus()) then
    raise exception 'hanya pengurus atau moderator yang boleh menulis audit log'
      using errcode = '42501';
  end if;

  insert into audit_logs (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_metadata);
end;
$$;

revoke execute on function log_audit(text, text, uuid, jsonb) from anon;
grant execute on function log_audit(text, text, uuid, jsonb) to authenticated;

-- Moderators need to read the trail too, not just admins — they are the ones
-- whose actions it records, and the admin panel shows it to both.
drop policy if exists "admin baca audit log" on audit_logs;
create policy "moderator baca audit log" on audit_logs for select
  using (is_moderator());
