-- marketplace_bids only required bidder_id = auth.uid(), so nothing stopped a
-- bid that was placed by the seller on their own item, placed after the
-- auction closed, placed on an item that was never an auction, or that
-- undercut the current highest bid.
--
-- Server actions could check all of that, but the table is reachable directly
-- through PostgREST with any member's token, so the rules have to live here to
-- mean anything.

create or replace function validate_marketplace_bid()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  item marketplace_items;
  highest int;
begin
  select * into item from marketplace_items where id = new.item_id;

  if item is null then
    raise exception 'Barang tidak ditemukan.' using errcode = '23503';
  end if;

  if item.seller_id = new.bidder_id then
    raise exception 'Penjual tidak boleh menawar barangnya sendiri.'
      using errcode = '42501';
  end if;

  if not item.is_auction then
    raise exception 'Barang ini tidak dilelang.' using errcode = '22023';
  end if;

  if item.status <> 'tersedia' then
    raise exception 'Barang ini sudah tidak tersedia.' using errcode = '22023';
  end if;

  if item.auction_end_at <= now() then
    raise exception 'Lelang untuk barang ini sudah ditutup.'
      using errcode = '22023';
  end if;

  select max(amount) into highest
  from marketplace_bids where item_id = new.item_id;

  -- The listed price acts as the opening bid when nobody has bid yet.
  if highest is not null and new.amount <= highest then
    raise exception 'Tawaran harus lebih tinggi dari tawaran tertinggi saat ini (%).', highest
      using errcode = '22023';
  end if;

  if highest is null and item.price is not null and new.amount < item.price then
    raise exception 'Tawaran tidak boleh di bawah harga awal (%).', item.price
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger marketplace_bids_validate
  before insert on marketplace_bids
  for each row execute function validate_marketplace_bid();

-- Bids are already public, so the highest one can be read directly. This just
-- saves every listing card from running its own aggregate.
create or replace function marketplace_top_bids()
returns table (item_id uuid, top_bid int, bid_count bigint)
language sql stable security definer set search_path = public as $$
  select item_id, max(amount)::int, count(*)
  from marketplace_bids
  group by item_id;
$$;

grant execute on function marketplace_top_bids() to anon, authenticated;
