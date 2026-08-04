-- No table was in the supabase_realtime publication, so nothing in the app was
-- ever live: a new direct message or a competing bid only appeared after a
-- manual refresh.
--
-- Only two tables are added, and deliberately so. Broadcasting a table means
-- its row changes leave the database on every write, so each one is a decision
-- about exposure rather than a convenience:
--
--   messages          — private, but the whole point of a chat. Realtime
--                       applies the table's RLS per subscriber, so a member
--                       only receives rows they could already have selected.
--                       Verified against a second account before shipping.
--   marketplace_bids  — already world-readable ("tawaran terlihat publik"),
--                       so a live auction leaks nothing new.
--
-- Everything else stays off. Notifications, forum replies and the rest are
-- cheap enough to fetch on navigation, and each extra table is another stream
-- of row data crossing the wire for no real gain.

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table marketplace_bids;

-- Realtime needs the full row to evaluate RLS for DELETE and UPDATE events;
-- without this it only receives the primary key and cannot decide.
alter table messages replica identity full;
alter table marketplace_bids replica identity full;
