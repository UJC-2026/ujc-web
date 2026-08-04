-- Global search across everything a member can already see.
--
-- Deliberately NOT security definer. Running as the caller means RLS decides
-- what each row set contains, so an unpublished article, an unverified job
-- listing, a hidden profile, or someone else's private conversation can never
-- surface here — without this function having to re-implement any of those
-- rules and risk getting one of them wrong.
--
-- 'simple' rather than a language config: Postgres ships no Indonesian
-- dictionary, and stemming with the English one would mangle both Indonesian
-- and Japanese terms. 'simple' just tokenises, which is the honest choice for
-- mixed-language content.

create index if not exists blog_posts_search_idx on blog_posts
  using gin (to_tsvector('simple', title || ' ' || coalesce(content, '')));
create index if not exists marketplace_items_search_idx on marketplace_items
  using gin (to_tsvector('simple', title || ' ' || coalesce(description, '')));
create index if not exists jobs_search_idx on jobs
  using gin (to_tsvector('simple', title || ' ' || company || ' ' || coalesce(description, '')));
create index if not exists events_search_idx on events
  using gin (to_tsvector('simple', title || ' ' || coalesce(description, '')));
create index if not exists resources_search_idx on resources
  using gin (to_tsvector('simple', title || ' ' || coalesce(description, '')));
create index if not exists businesses_search_idx on businesses
  using gin (to_tsvector('simple', name || ' ' || coalesce(description, '')));

create or replace function global_search(q text, per_kind int default 5)
returns table (
  kind text,
  id uuid,
  title text,
  snippet text,
  href text,
  rank real
) language plpgsql stable as $$
declare
  tsq tsquery;
begin
  if q is null or btrim(q) = '' then
    return;
  end if;

  -- websearch_to_tsquery tolerates whatever a person actually types
  -- (quotes, OR, stray punctuation) instead of erroring on it.
  tsq := websearch_to_tsquery('simple', q);

  return query
  (
    select 'forum'::text, t.id, t.title,
           left(regexp_replace(t.content, '<[^>]*>', ' ', 'g'), 160),
           '/forum/' || c.slug || '/' || t.id,
           ts_rank(to_tsvector('simple', t.title || ' ' || t.content), tsq)
    from forum_threads t
    join forum_categories c on c.id = t.category_id
    where to_tsvector('simple', t.title || ' ' || t.content) @@ tsq
    order by 6 desc limit per_kind
  )
  union all
  (
    select 'blog'::text, b.id, b.title,
           left(regexp_replace(coalesce(b.content, ''), '<[^>]*>', ' ', 'g'), 160),
           '/blog/' || b.slug,
           ts_rank(to_tsvector('simple', b.title || ' ' || coalesce(b.content, '')), tsq)
    from blog_posts b
    where to_tsvector('simple', b.title || ' ' || coalesce(b.content, '')) @@ tsq
    order by 6 desc limit per_kind
  )
  union all
  (
    select 'marketplace'::text, m.id, m.title,
           left(coalesce(m.description, ''), 160),
           '/marketplace/' || m.id,
           ts_rank(to_tsvector('simple', m.title || ' ' || coalesce(m.description, '')), tsq)
    from marketplace_items m
    where to_tsvector('simple', m.title || ' ' || coalesce(m.description, '')) @@ tsq
    order by 6 desc limit per_kind
  )
  union all
  (
    select 'jobs'::text, j.id, j.title || ' — ' || j.company,
           left(coalesce(j.description, ''), 160),
           '/jobs/' || j.id,
           ts_rank(to_tsvector('simple', j.title || ' ' || j.company || ' ' || coalesce(j.description, '')), tsq)
    from jobs j
    where to_tsvector('simple', j.title || ' ' || j.company || ' ' || coalesce(j.description, '')) @@ tsq
    order by 6 desc limit per_kind
  )
  union all
  (
    select 'events'::text, e.id, e.title,
           left(coalesce(e.description, ''), 160),
           '/events/' || e.id,
           ts_rank(to_tsvector('simple', e.title || ' ' || coalesce(e.description, '')), tsq)
    from events e
    where to_tsvector('simple', e.title || ' ' || coalesce(e.description, '')) @@ tsq
    order by 6 desc limit per_kind
  )
  union all
  (
    select 'resources'::text, r.id, r.title,
           left(coalesce(r.description, ''), 160),
           coalesce(r.link, r.file_url, '/resources'),
           ts_rank(to_tsvector('simple', r.title || ' ' || coalesce(r.description, '')), tsq)
    from resources r
    where to_tsvector('simple', r.title || ' ' || coalesce(r.description, '')) @@ tsq
    order by 6 desc limit per_kind
  )
  union all
  (
    -- Only public profiles are readable, so hidden members never appear.
    select 'members'::text, p.id, p.full_name,
           left(coalesce(p.bio, ''), 160),
           '/members/' || p.id,
           ts_rank(to_tsvector('simple', p.full_name || ' ' || coalesce(p.bio, '')), tsq)
    from profiles p
    where to_tsvector('simple', p.full_name || ' ' || coalesce(p.bio, '')) @@ tsq
    order by 6 desc limit per_kind
  )
  union all
  (
    select 'business'::text, s.id, s.name,
           left(coalesce(s.description, ''), 160),
           '/business',
           ts_rank(to_tsvector('simple', s.name || ' ' || coalesce(s.description, '')), tsq)
    from businesses s
    where to_tsvector('simple', s.name || ' ' || coalesce(s.description, '')) @@ tsq
    order by 6 desc limit per_kind
  );
end;
$$;

grant execute on function global_search(text, int) to anon, authenticated;
