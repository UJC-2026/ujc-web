import Link from "next/link";
import Image from "next/image";
import { Gavel, Gift, MapPin, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auctionClosed, type MarketItem } from "@/lib/marketplace/queries";
import { AuctionCountdown } from "./auction-countdown";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const STATUS = {
  tersedia: null,
  dipesan: { label: "Dipesan", variant: "accent" as const },
  terjual: { label: "Terjual", variant: "neutral" as const },
};

export function ItemCard({ item }: { item: MarketItem }) {
  const closed = auctionClosed(item);
  const badge = STATUS[item.status];

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-accent">
      {item.images[0] ? (
        <Image
          src={item.images[0]}
          alt=""
          width={480}
          height={320}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-primary/8">
          <Package className="size-9 text-primary/40" aria-hidden />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {item.is_giveaway && (
            <Badge variant="success">
              <Gift aria-hidden />
              Gratis
            </Badge>
          )}
          {item.is_auction && (
            <Badge variant={closed ? "outline" : "primary"}>
              <Gavel aria-hidden />
              {closed ? "Lelang ditutup" : "Lelang"}
            </Badge>
          )}
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
          {item.condition && <Badge variant="outline">{item.condition}</Badge>}
        </div>

        <h3 className="mt-3 text-h3 font-medium text-foreground">
          <Link href={`/marketplace/${item.id}`}>
            <span className="absolute inset-0" aria-hidden />
            {item.title}
          </Link>
        </h3>

        {(item.city || item.prefecture) && (
          <p className="mt-2 flex items-center gap-1.5 text-caption text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {[item.city, item.prefecture].filter(Boolean).join(", ")}
          </p>
        )}

        <div className="mt-auto pt-4">
          {item.is_giveaway ? (
            <p className="text-h3 font-semibold text-success">Gratis</p>
          ) : item.is_auction ? (
            <>
              <p className="text-h3 font-semibold text-foreground">
                {yen.format(item.topBid || item.price || 0)}
              </p>
              <p className="text-caption text-muted-foreground">
                {item.bidCount > 0
                  ? `${item.bidCount} tawaran`
                  : "Belum ada tawaran"}
              </p>
              {!closed && item.auction_end_at && (
                <AuctionCountdown endAt={item.auction_end_at} compact />
              )}
            </>
          ) : (
            <p className="text-h3 font-semibold text-foreground">
              {item.price !== null ? yen.format(item.price) : "Nego"}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
