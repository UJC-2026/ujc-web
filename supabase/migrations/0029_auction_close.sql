-- Auctions that actually conclude.
--
-- Bidding has been closed correctly since 0012 — the validation trigger
-- refuses anything past `auction_end_at` — and the item page renders "lelang
-- ditutup" off the same timestamp. What never happened is the conclusion: the
-- item kept `status = 'tersedia'` forever, no winner was recorded anywhere,
-- and neither the winner nor the seller was told the thing had ended. An
-- auction nobody is told they won is not an auction.
--
-- Time passing fires no trigger, so something has to run this. The function
-- below is idempotent and takes no arguments, which lets it be driven either
-- by a scheduler or by ordinary page loads; see the note on `close_due_auctions`.

alter table marketplace_items
  add column auction_closed_at timestamptz,
  add column auction_winner_id uuid references profiles (id) on delete set null;

-- Partial index: the sweep asks "which auctions are due and still open", which
-- is almost always none, and this keeps that answer free.
create index marketplace_auctions_due_idx
  on marketplace_items (auction_end_at)
  where is_auction and auction_closed_at is null;

/**
 * Concludes every auction whose deadline has passed, and returns how many it
 * closed.
 *
 * `auction_closed_at` is the idempotence marker: it is what makes running this
 * twice — or a hundred times, from a hundred page loads — do the work once and
 * send one notification. Without it, a lazily-invoked sweep would re-notify
 * the winner on every visit.
 *
 * Notifications are inserted here rather than through `notify_user()`, which
 * returns early when the target is the caller. That rule is right for "X
 * replied to your thread" and wrong here: whoever's page load happens to
 * trigger the sweep is usually a bidder, and quite possibly the winner, who
 * would then be the one person never told they had won.
 */
create or replace function close_due_auctions()
returns integer language plpgsql security definer set search_path = public as $$
declare
  due record;
  top record;
  closed integer := 0;
begin
  for due in
    select id, seller_id, title, price
    from marketplace_items
    where is_auction
      and auction_closed_at is null
      and auction_end_at <= now()
    -- Skips rows another concurrent sweep is already handling instead of
    -- queueing behind it; that one will finish the work.
    for update skip locked
  loop
    select bidder_id, amount into top
    from marketplace_bids
    where item_id = due.id
    order by amount desc, created_at asc
    limit 1;

    if top.bidder_id is not null then
      -- 'dipesan', not 'terjual': the win reserves the item, the handover
      -- between two people is what actually sells it, and only the seller can
      -- say that has happened.
      update marketplace_items
         set auction_closed_at = now(),
             auction_winner_id = top.bidder_id,
             status = 'dipesan'
       where id = due.id;

      insert into notifications (user_id, type, title, body, link)
      select top.bidder_id, 'lelang_menang',
             'Kamu memenangkan lelang',
             'Tawaranmu ¥' || top.amount || ' untuk "' || due.title ||
               '" jadi yang tertinggi. Hubungi penjual untuk serah terima.',
             '/marketplace/' || due.id
      where not exists (
        select 1 from notification_preferences p
        where p.user_id = top.bidder_id and p.type = 'lelang_menang'
          and not p.channel_inapp
      );

      insert into notifications (user_id, type, title, body, link)
      select due.seller_id, 'lelang_selesai',
             'Lelangmu sudah ditutup',
             '"' || due.title || '" dimenangkan dengan tawaran ¥' || top.amount || '.',
             '/marketplace/' || due.id
      where not exists (
        select 1 from notification_preferences p
        where p.user_id = due.seller_id and p.type = 'lelang_selesai'
          and not p.channel_inapp
      );
    else
      -- No bids: the listing stays 'tersedia' so the seller can relist or sell
      -- it outright. Only the marker and the notice are needed.
      update marketplace_items
         set auction_closed_at = now()
       where id = due.id;

      insert into notifications (user_id, type, title, body, link)
      select due.seller_id, 'lelang_selesai',
             'Lelangmu berakhir tanpa penawar',
             '"' || due.title || '" tidak mendapat tawaran. Barangnya masih tersedia.',
             '/marketplace/' || due.id
      where not exists (
        select 1 from notification_preferences p
        where p.user_id = due.seller_id and p.type = 'lelang_selesai'
          and not p.channel_inapp
      );
    end if;

    closed := closed + 1;
  end loop;

  return closed;
end;
$$;

-- Anonymous visitors get execute too, on purpose: the marketplace index is
-- public, so a logged-out visitor is a perfectly ordinary trigger for the
-- sweep, and it takes no arguments and reveals nothing in its return value.
revoke all on function close_due_auctions() from public;
grant execute on function close_due_auctions() to anon, authenticated;

/**
 * pg_cron is deliberately NOT enabled here.
 *
 * It is available on Supabase but not on every plan, and a `create extension`
 * that the project is not entitled to would fail the migration and block every
 * later deploy — to buy punctuality for a function that is already correct
 * whenever anyone looks at the marketplace. Scheduling it is an optimisation,
 * documented in DEPLOYMENT.md, not a dependency.
 */
