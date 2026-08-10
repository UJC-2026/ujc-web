import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Gavel, Gift, MapPin, MessageSquare, Package } from "lucide-react";
import {
  auctionClosed,
  getItemBids,
  getMarketItem,
} from "@/lib/marketplace/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { AuctionCountdown } from "@/components/marketplace/auction-countdown";
import { BidForm } from "@/components/marketplace/bid-form";
import { StatusControl } from "@/components/marketplace/status-control";
import { ReportDialog } from "@/components/forum/report-dialog";
import { openConversation } from "@/app/(app)/messages/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeID, relativeTime } from "@/lib/format";

type PageProps = { params: Promise<{ id: string }> };

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getMarketItem(id);

  if (!item) return { title: "Barang tidak ditemukan" };

  return {
    title: `${item.title} · Marketplace`,
    description: item.description?.slice(0, 155),
    openGraph: {
      title: item.title,
      description: item.description?.slice(0, 155),
      // See the note in events/[id]: a present `images` key suppresses
      // opengraph-image.tsx even when its value is undefined.
      ...(item.images[0] ? { images: [item.images[0]] } : {}),
    },
  };
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;

  const [item, profile] = await Promise.all([
    getMarketItem(id),
    getCurrentProfile(),
  ]);

  if (!item) notFound();

  const bids = item.is_auction ? await getItemBids(item.id) : [];
  const closed = auctionClosed(item);
  const isSeller = profile?.id === item.seller_id;

  // The winner is recorded on the item; the bid list already carries the names.
  const winner = item.auction_winner_id
    ? (bids.find((bid) => bid.bidder_id === item.auction_winner_id)?.bidder ??
      null)
    : null;

  // The listed price opens the bidding; after that each bid must beat the last.
  const minimumBid = item.topBid > 0 ? item.topBid + 1 : (item.price ?? 1);

  const canBid =
    Boolean(profile) &&
    item.is_auction &&
    !closed &&
    !isSeller &&
    item.status === "tersedia";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/marketplace" className="transition-colors hover:text-primary">
          Marketplace
        </Link>
      </nav>

      {item.images[0] ? (
        <Image
          src={item.images[0]}
          alt=""
          width={1200}
          height={600}
          priority
          className="mt-5 h-64 w-full rounded-panel object-cover sm:h-80"
        />
      ) : (
        <div className="mt-5 flex h-64 w-full items-center justify-center rounded-panel bg-primary/8 sm:h-80">
          <Package className="size-12 text-primary/40" aria-hidden />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        {item.is_giveaway && (
          <Badge variant="success">
            <Gift aria-hidden />
            Gratis
          </Badge>
        )}
        {item.is_auction && (
          <Badge variant={closed ? "outline" : "primary"}>
            <Gavel aria-hidden />
            {closed ? "Lelang ditutup" : "Lelang berjalan"}
          </Badge>
        )}
        {item.status !== "tersedia" && (
          <Badge variant={item.status === "terjual" ? "neutral" : "accent"}>
            {item.status === "terjual" ? "Terjual" : "Dipesan"}
          </Badge>
        )}
        {item.condition && <Badge variant="outline">{item.condition}</Badge>}
        {item.category && <Badge variant="outline">{item.category}</Badge>}
      </div>

      <h1 className="mt-3 text-h1 text-foreground">{item.title}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="text-h2 font-semibold text-foreground">
          {item.is_giveaway
            ? "Gratis"
            : item.is_auction
              ? yen.format(item.topBid || item.price || 0)
              : item.price !== null
                ? yen.format(item.price)
                : "Nego"}
        </p>
        {item.is_auction && (
          <span className="text-caption text-muted-foreground">
            {item.bidCount > 0
              ? `${item.bidCount} tawaran`
              : "Belum ada tawaran"}
          </span>
        )}
        {(item.city || item.prefecture) && (
          <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <MapPin className="size-4" aria-hidden />
            {[item.city, item.prefecture].filter(Boolean).join(", ")}
          </span>
        )}
      </div>

      {/* The result, once close_due_auctions has settled it (0029). Shown to
          everyone — an auction whose outcome is hidden looks unfinished — with
          an extra line for the two people it actually obliges. */}
      {item.is_auction && item.auction_winner_id && (
        <div className="mt-5 rounded-panel border border-accent/40 bg-accent-muted/30 p-5">
          <p className="flex items-center gap-2 text-body font-medium text-foreground">
            <Gavel className="size-5 shrink-0 text-primary" aria-hidden />
            Dimenangkan {winner ? `oleh ${winner.full_name}` : ""} dengan
            tawaran {yen.format(item.topBid)}
          </p>
          {profile?.id === item.auction_winner_id && (
            <p className="mt-2 text-caption text-muted-foreground">
              Kamu pemenangnya. Hubungi penjual lewat pesan untuk serah terima.
            </p>
          )}
          {isSeller && (
            <p className="mt-2 text-caption text-muted-foreground">
              Barangnya ditandai dipesan. Tandai terjual setelah serah terima
              selesai.
            </p>
          )}
        </div>
      )}

      {item.is_auction && !closed && item.auction_end_at && (
        <div className="mt-3">
          <AuctionCountdown endAt={item.auction_end_at} />
          <p className="mt-1 text-caption text-muted-foreground">
            Berakhir {formatDateTimeID(item.auction_end_at)}
          </p>
        </div>
      )}

      {item.description && (
        <div className="mt-8">
          <h2 className="rule-gold text-h3 text-foreground">Deskripsi</h2>
          <p className="mt-5 text-body whitespace-pre-line text-muted-foreground">
            {item.description}
          </p>
        </div>
      )}

      <section className="mt-8 rounded-panel border border-border bg-surface p-6">
        <h2 className="text-h3 text-foreground">Penjual</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Avatar
            src={item.seller?.avatar_url}
            name={item.seller?.full_name ?? "Anggota"}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/members/${item.seller_id}`}
              className="text-body font-medium text-foreground transition-colors hover:text-primary"
            >
              {item.seller?.full_name ?? "Anggota UJC"}
            </Link>
            <p className="text-caption text-muted-foreground">
              Dipasang {relativeTime(item.created_at)}
            </p>
          </div>
          {profile && !isSeller && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Reuses the shared DM infrastructure rather than a
                  marketplace-only chat. */}
              <form action={openConversation}>
                <input type="hidden" name="otherId" value={item.seller_id} />
                <Button type="submit" size="sm" variant="outline">
                  <MessageSquare aria-hidden />
                  Hubungi penjual
                </Button>
              </form>
              <ReportDialog contentType="barang" contentId={item.id} />
            </div>
          )}
        </div>
      </section>

      {isSeller && (
        <section className="mt-8 rounded-panel border border-accent/40 bg-accent-muted/30 p-6">
          <h2 className="text-h3 text-foreground">Kelola barangmu</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Perbarui status supaya anggota lain tahu barang ini masih tersedia
            atau tidak.
          </p>
          <div className="mt-4">
            <StatusControl itemId={item.id} status={item.status} />
          </div>
        </section>
      )}

      {item.is_auction && (
        <section className="mt-8">
          <h2 className="rule-gold text-h3 text-foreground">Tawaran</h2>

          {bids.length === 0 ? (
            <p className="mt-5 text-body text-muted-foreground">
              Belum ada tawaran masuk.
            </p>
          ) : (
            <ol className="mt-5 space-y-2.5">
              {bids.map((bid, index) => (
                <li
                  key={bid.id}
                  className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
                >
                  {index === 0 && <Badge variant="accent">Tertinggi</Badge>}
                  <span className="min-w-0 flex-1 truncate text-body text-foreground">
                    {bid.bidder?.full_name ?? "Anggota"}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {relativeTime(bid.created_at)}
                  </span>
                  <span className="text-body font-medium tabular-nums text-foreground">
                    {yen.format(bid.amount)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {item.is_auction && (
        <section className="mt-8 rounded-panel border border-border bg-surface p-6">
          <h2 className="text-h3 text-foreground">Ikut menawar</h2>

          {!profile ? (
            <div className="mt-5">
              <p className="text-body text-muted-foreground">
                Masuk dulu untuk ikut menawar.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/login?next=/marketplace/${item.id}`}>Masuk</Link>
              </Button>
            </div>
          ) : isSeller ? (
            <p className="mt-5 text-body text-muted-foreground">
              Kamu penjual barang ini, jadi tidak bisa ikut menawar.
            </p>
          ) : closed ? (
            <p className="mt-5 text-body text-muted-foreground">
              {item.auction_winner_id
                ? "Lelang sudah ditutup — hasilnya ada di atas."
                : "Lelang sudah ditutup tanpa penawar."}
            </p>
          ) : item.status !== "tersedia" ? (
            <p className="mt-5 text-body text-muted-foreground">
              Barang ini sudah tidak tersedia.
            </p>
          ) : canBid ? (
            <div className="mt-5">
              <BidForm itemId={item.id} minimum={minimumBid} />
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
