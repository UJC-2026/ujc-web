import { createClient } from "@/lib/supabase/server";

export type ItemStatus = "tersedia" | "dipesan" | "terjual";

export type MarketItem = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: string | null;
  condition: string | null;
  price: number | null;
  is_giveaway: boolean;
  images: string[];
  city: string | null;
  prefecture: string | null;
  status: ItemStatus;
  is_auction: boolean;
  auction_end_at: string | null;
  /** Set by close_due_auctions once the deadline has passed. */
  auction_closed_at: string | null;
  auction_winner_id: string | null;
  created_at: string;
  seller: { id: string; full_name: string; avatar_url: string | null } | null;
  /** Filled from marketplace_top_bids; 0 when nobody has bid. */
  topBid: number;
  bidCount: number;
};

const SELLER_FIELDS =
  "seller:profiles!marketplace_items_seller_id_fkey(id, full_name, avatar_url)";

/**
 * Concludes any auction whose deadline has passed, before the page reads the
 * rows it is about to render.
 *
 * Nothing in Postgres fires when a timestamp goes by, so somebody has to ask.
 * Doing it on the way into the marketplace means the result is correct for
 * whoever is looking, on any deployment, with no scheduler to provision — and
 * `close_due_auctions()` is idempotent and indexed, so the usual case is one
 * cheap query returning zero rows. DEPLOYMENT.md covers scheduling it with
 * pg_cron as well, which only makes the closing punctual rather than
 * eventual; it does not change what this reads.
 */
async function sweepDueAuctions(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  // A failure here must not take the marketplace down with it: the worst
  // outcome is an auction that shows as running slightly too long.
  const { error } = await supabase.rpc("close_due_auctions");
  if (error) {
    console.error("close_due_auctions failed", error.message);
  }
}

async function withBids(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Record<string, unknown>[],
): Promise<MarketItem[]> {
  const { data: bids } = await supabase.rpc("marketplace_top_bids");

  const byItem = new Map<string, { top: number; count: number }>();
  for (const row of bids ?? []) {
    byItem.set(row.item_id as string, {
      top: Number(row.top_bid ?? 0),
      count: Number(row.bid_count ?? 0),
    });
  }

  return rows.map((row) => {
    const seller = Array.isArray(row.seller) ? row.seller[0] : row.seller;
    const bid = byItem.get(row.id as string);
    return {
      ...(row as unknown as MarketItem),
      seller: (seller as MarketItem["seller"]) ?? null,
      topBid: bid?.top ?? 0,
      bidCount: bid?.count ?? 0,
    };
  });
}

export async function getMarketItems({
  category,
  onlyGiveaway = false,
  onlyAuction = false,
}: {
  category?: string;
  onlyGiveaway?: boolean;
  onlyAuction?: boolean;
} = {}): Promise<MarketItem[]> {
  const supabase = await createClient();
  await sweepDueAuctions(supabase);

  let query = supabase
    .from("marketplace_items")
    .select(`*, ${SELLER_FIELDS}`)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (onlyGiveaway) query = query.eq("is_giveaway", true);
  if (onlyAuction) query = query.eq("is_auction", true);

  const { data } = await query;
  return withBids(supabase, (data ?? []) as Record<string, unknown>[]);
}

export async function getMarketItem(id: string): Promise<MarketItem | null> {
  const supabase = await createClient();
  await sweepDueAuctions(supabase);

  const { data } = await supabase
    .from("marketplace_items")
    .select(`*, ${SELLER_FIELDS}`)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const [item] = await withBids(supabase, [data as Record<string, unknown>]);
  return item ?? null;
}

export async function getMarketCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("marketplace_items").select("category");

  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.category) set.add(row.category as string);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
}

export type Bid = {
  id: string;
  amount: number;
  created_at: string;
  /** Carried so the winning bid can be matched by id rather than by name. */
  bidder_id: string;
  bidder: { full_name: string } | null;
};

export async function getItemBids(itemId: string): Promise<Bid[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_bids")
    .select(
      "id, amount, created_at, bidder_id, bidder:profiles!marketplace_bids_bidder_id_fkey(full_name)",
    )
    .eq("item_id", itemId)
    .order("amount", { ascending: false });

  return (data ?? []).map((row) => {
    const bidder = Array.isArray(row.bidder) ? row.bidder[0] : row.bidder;
    return {
      id: row.id as string,
      amount: row.amount as number,
      created_at: row.created_at as string,
      bidder_id: row.bidder_id as string,
      bidder: (bidder as { full_name: string }) ?? null,
    };
  });
}

/** True once the auction's end time has passed. */
export function auctionClosed(item: Pick<MarketItem, "is_auction" | "auction_end_at">) {
  if (!item.is_auction || !item.auction_end_at) return false;
  return new Date(item.auction_end_at).getTime() <= Date.now();
}
