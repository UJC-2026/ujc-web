import { ImageResponse } from "next/og";
import { getMarketItem } from "@/lib/marketplace/queries";
import { formatYen } from "@/lib/utils";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";

export const alt = "Barang di marketplace UNSIA Japan Community";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getMarketItem(id);

  if (!item) {
    return new ImageResponse(
      <OgCard eyebrow="Marketplace" title="Barang UJC" />,
      size,
    );
  }

  // A giveaway has no price, and an auction's meaningful number is the
  // standing bid rather than the asking price.
  const price = item.is_giveaway
    ? "Gratis"
    : item.is_auction
      ? `Tawaran tertinggi ${formatYen(item.topBid)}`
      : item.price !== null
        ? formatYen(item.price)
        : null;

  const place = [item.city, item.prefecture].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <OgCard
        eyebrow={item.category ? `Marketplace · ${item.category}` : "Marketplace"}
        title={item.title}
        meta={[price, place].filter(Boolean).join(" · ")}
      />
    ),
    size,
  );
}
