-- PostgREST checks two things before a row is ever considered: the SQL
-- privilege on the table, and then the RLS policy. The earlier migrations only
-- ever defined policies, so every request failed at the privilege step with
-- "permission denied for table ..." regardless of how permissive the policy
-- was.
--
-- Row Level Security is enabled on all tables in this schema (verified before
-- writing this migration), so the grants below are deliberately broad and RLS
-- stays the single place where access is actually decided. Anonymous visitors
-- may only read; everything that writes requires a signed-in session.

grant usage on schema public to anon, authenticated;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

-- Tables added by later migrations should inherit the same treatment, so the
-- next one does not silently reintroduce the same failure.
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- The RPCs called from server actions and pages.
grant execute on function increment_thread_views(uuid) to anon, authenticated;
grant execute on function match_moderation_keyword(text) to authenticated;
