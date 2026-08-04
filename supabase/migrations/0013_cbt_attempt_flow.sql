-- cbt_questions had no read policy for ordinary members, so nobody could
-- actually sit a test. Granting a plain read would have handed out
-- correct_answer along with the question, which is worse.
--
-- Instead the whole attempt flow goes through SECURITY DEFINER functions:
-- questions come back without their answers, grading happens inside the
-- database, and the key is only revealed for an attempt the caller has already
-- finished. correct_answer never crosses the wire before submission.

-- ---------------------------------------------------------------------------
-- start
-- ---------------------------------------------------------------------------

create or replace function cbt_start_attempt(p_category uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_total int;
  v_attempt uuid;
begin
  if v_user is null then
    raise exception 'Masuk dulu untuk mengerjakan tes.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from cbt_test_categories
    where id = p_category
      and (is_published or has_divisi('pendidikan') or is_admin())
  ) then
    raise exception 'Kategori tes tidak tersedia.' using errcode = '42501';
  end if;

  select count(*) into v_total from cbt_questions where category_id = p_category;

  if v_total = 0 then
    raise exception 'Bank soal untuk kategori ini masih kosong.'
      using errcode = '22023';
  end if;

  -- Reuse an attempt that was started but never submitted, so a refresh or a
  -- dropped connection does not silently strand it.
  select id into v_attempt
  from cbt_attempts
  where user_id = v_user and category_id = p_category and finished_at is null
  order by started_at desc
  limit 1;

  if v_attempt is not null then
    return v_attempt;
  end if;

  insert into cbt_attempts (user_id, category_id, total_questions)
  values (v_user, p_category, v_total)
  returning id into v_attempt;

  return v_attempt;
end;
$$;

-- ---------------------------------------------------------------------------
-- questions (no answers)
-- ---------------------------------------------------------------------------

create or replace function cbt_attempt_questions(p_attempt uuid)
returns table (id uuid, question text, options jsonb, sort_order int)
language plpgsql stable security definer set search_path = public as $$
declare
  v_attempt cbt_attempts;
begin
  select * into v_attempt from cbt_attempts where cbt_attempts.id = p_attempt;

  if v_attempt is null or v_attempt.user_id <> auth.uid() then
    raise exception 'Percobaan tes tidak ditemukan.' using errcode = '42501';
  end if;

  return query
    select q.id, q.question, q.options, q.sort_order
    from cbt_questions q
    where q.category_id = v_attempt.category_id
    order by q.sort_order, q.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- submit & grade
-- ---------------------------------------------------------------------------

-- p_answers maps question id -> the selected option, e.g. {"<uuid>": "わたしの"}
create or replace function cbt_submit_attempt(p_attempt uuid, p_answers jsonb)
returns table (score int, total int)
language plpgsql security definer set search_path = public as $$
declare
  v_attempt cbt_attempts;
  v_score int;
  v_total int;
begin
  select * into v_attempt from cbt_attempts where cbt_attempts.id = p_attempt;

  if v_attempt is null or v_attempt.user_id <> auth.uid() then
    raise exception 'Percobaan tes tidak ditemukan.' using errcode = '42501';
  end if;

  if v_attempt.finished_at is not null then
    raise exception 'Percobaan tes ini sudah dikumpulkan.' using errcode = '22023';
  end if;

  -- Grade against the stored key; the client only ever sent its choices.
  insert into cbt_answers (attempt_id, question_id, selected_answer, is_correct)
  select
    p_attempt,
    q.id,
    p_answers ->> q.id::text,
    coalesce(p_answers ->> q.id::text = q.correct_answer, false)
  from cbt_questions q
  where q.category_id = v_attempt.category_id
  on conflict (attempt_id, question_id) do update
    set selected_answer = excluded.selected_answer,
        is_correct = excluded.is_correct;

  select count(*) filter (where is_correct), count(*)
    into v_score, v_total
  from cbt_answers where attempt_id = p_attempt;

  update cbt_attempts
    set score = v_score, total_questions = v_total, finished_at = now()
    where id = p_attempt;

  return query select v_score, v_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- review (answers revealed only after submitting)
-- ---------------------------------------------------------------------------

create or replace function cbt_attempt_review(p_attempt uuid)
returns table (
  question_id uuid,
  question text,
  options jsonb,
  correct_answer text,
  explanation text,
  selected_answer text,
  is_correct boolean
) language plpgsql stable security definer set search_path = public as $$
declare
  v_attempt cbt_attempts;
begin
  select * into v_attempt from cbt_attempts where cbt_attempts.id = p_attempt;

  if v_attempt is null then
    raise exception 'Percobaan tes tidak ditemukan.' using errcode = '42501';
  end if;

  -- Divisi pendidikan may review any attempt to spot bad questions.
  if v_attempt.user_id <> auth.uid()
     and not has_divisi('pendidikan') and not is_admin() then
    raise exception 'Percobaan tes tidak ditemukan.' using errcode = '42501';
  end if;

  if v_attempt.finished_at is null then
    raise exception 'Kumpulkan tes dulu untuk melihat pembahasan.'
      using errcode = '22023';
  end if;

  return query
    select q.id, q.question, q.options, q.correct_answer, q.explanation,
           a.selected_answer, a.is_correct
    from cbt_questions q
    left join cbt_answers a
      on a.question_id = q.id and a.attempt_id = p_attempt
    where q.category_id = v_attempt.category_id
    order by q.sort_order, q.id;
end;
$$;

-- Question counts per category, so the listing does not need to read the bank.
create or replace function cbt_category_counts()
returns table (category_id uuid, question_count bigint)
language sql stable security definer set search_path = public as $$
  select category_id, count(*) from cbt_questions group by category_id;
$$;

revoke execute on function cbt_start_attempt(uuid) from anon;
revoke execute on function cbt_attempt_questions(uuid) from anon;
revoke execute on function cbt_submit_attempt(uuid, jsonb) from anon;
revoke execute on function cbt_attempt_review(uuid) from anon;

grant execute on function cbt_start_attempt(uuid) to authenticated;
grant execute on function cbt_attempt_questions(uuid) to authenticated;
grant execute on function cbt_submit_attempt(uuid, jsonb) to authenticated;
grant execute on function cbt_attempt_review(uuid) to authenticated;
grant execute on function cbt_category_counts() to anon, authenticated;
