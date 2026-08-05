-- Self-service data export and account deletion.
--
-- The privacy page has been promising these as a manual request to pengurus.
-- Both are ordinary data-protection rights, and both are the kind of thing a
-- member should not have to ask a human for.
--
-- Neither can be done from the client with the anon key: an export has to read
-- ~30 tables whose policies differ, and a deletion has to reach `auth.users`,
-- which the app role cannot touch at all. So both are security-definer
-- functions scoped hard to `auth.uid()`.

-- ---------------------------------------------------------------------------
-- export
-- ---------------------------------------------------------------------------

/**
 * Everything the member is the subject of, as one JSON document.
 *
 * The table list is walked with dynamic SQL rather than written out as thirty
 * near-identical selects. The identifiers are literals from the list below,
 * never anything the caller supplies, and `format(%I)` quotes them regardless.
 *
 * `to_jsonb(x)` takes whole rows on purpose: a column added later lands in the
 * export automatically instead of being silently withheld from the person it
 * describes.
 *
 * Whole rows do mean an opaque id belonging to someone else can ride along in
 * a reference column — `peduli_cases.verified_by` names the pengurus who
 * approved the member's own request, `mentorship_requests.mentor_id` the
 * mentor they asked. That is kept deliberately: the relationship is part of
 * the member's record, and a bare uuid carries no name, contact, or content.
 * What must never appear is another person's *row*, and none does — every
 * table is filtered by the caller's own id.
 */
create or replace function export_my_data()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  spec record;
  rows jsonb;
  payload jsonb := '{}'::jsonb;
begin
  if uid is null then
    raise exception 'Masuk dulu untuk mengunduh datamu.' using errcode = '42501';
  end if;

  for spec in
    select * from (values
      ('profiles',                 'id'),
      ('forum_threads',            'author_id'),
      ('forum_replies',            'author_id'),
      ('forum_votes',              'user_id'),
      ('event_rsvp',               'user_id'),
      ('event_checkins',           'user_id'),
      ('certificates',             'user_id'),
      ('workshop_registrations',   'user_id'),
      ('blog_posts',               'author_id'),
      ('blog_comments',            'author_id'),
      ('blog_likes',               'user_id'),
      ('gallery_photos',           'uploaded_by'),
      ('user_points',              'user_id'),
      ('marketplace_items',        'seller_id'),
      ('marketplace_bids',         'bidder_id'),
      ('cbt_attempts',             'user_id'),
      ('job_saves',                'user_id'),
      ('mentors',                  'user_id'),
      ('mentorship_requests',      'mentee_id'),
      ('businesses',               'owner_id'),
      ('member_locations',         'user_id'),
      ('messages',                 'sender_id'),
      ('notifications',            'user_id'),
      ('notification_preferences', 'user_id'),
      ('member_dues',              'user_id'),
      ('creative_works',           'submitted_by'),
      ('peduli_cases',             'submitted_by'),
      ('peduli_donations',         'donor_id'),
      ('ai_chat_sessions',         'user_id'),
      ('jobs',                     'posted_by'),
      ('resources',                'uploaded_by')
    ) as t(tbl, col)
  loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(x) order by x), ''[]''::jsonb) from %I x where x.%I = $1',
      spec.tbl, spec.col
    ) into rows using uid;

    payload := payload || jsonb_build_object(spec.tbl, rows);
  end loop;

  return jsonb_build_object(
    'exported_at', now(),
    'user_id', uid,
    'data', payload
  );
end;
$$;

revoke all on function export_my_data() from public, anon;
grant execute on function export_my_data() to authenticated;

-- ---------------------------------------------------------------------------
-- deletion
-- ---------------------------------------------------------------------------

/**
 * Deletes the caller's account.
 *
 * One statement does the work, because the foreign keys already encode the
 * right policy and have since 0001: `profiles` cascades from `auth.users`, a
 * member's own content cascades from `profiles`, and the rows that belong to
 * the organisation rather than the person — peduli donations, finance entries,
 * audit trail, events they once organised — are `on delete set null`, so they
 * survive with the person detached. Re-implementing that here would only risk
 * disagreeing with it.
 *
 * The last admin is refused: an empty admin set locks every pengurus tool for
 * everyone, and it cannot be undone from inside the app.
 */
create or replace function delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  admins int;
begin
  if uid is null then
    raise exception 'Masuk dulu untuk menghapus akunmu.' using errcode = '42501';
  end if;

  if exists (select 1 from profiles where id = uid and role = 'admin') then
    select count(*) into admins from profiles where role = 'admin';
    if admins <= 1 then
      raise exception
        'Kamu satu-satunya admin. Angkat admin lain dulu sebelum menghapus akun ini.'
        using errcode = '42501';
    end if;
  end if;

  -- Written before the delete, and deliberately without a name or an email:
  -- the point of the record is that a deletion happened and was accounted for,
  -- not to keep a copy of the person who asked for it. `actor_id` would be
  -- nulled by its own cascade a moment later, so the id goes in `target_id`,
  -- which carries no foreign key.
  insert into audit_logs (actor_id, action, target_type, target_id, metadata)
  values (null, 'akun.hapus_mandiri', 'profile', uid,
          jsonb_build_object('deleted_at', now()));

  delete from auth.users where id = uid;
end;
$$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;
