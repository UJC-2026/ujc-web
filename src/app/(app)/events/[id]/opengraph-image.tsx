import { ImageResponse } from "next/og";
import { getEventById } from "@/lib/events/queries";
import { formatDateTimeID } from "@/lib/format";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";

export const alt = "Kegiatan UNSIA Japan Community";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  // RLS may hide the event, or the id may be nonsense. A generic card still
  // beats a broken image in someone's chat window.
  if (!event) {
    return new ImageResponse(
      <OgCard eyebrow="Kegiatan" title="Kegiatan UJC" />,
      size,
    );
  }

  const place = event.is_online
    ? "Daring"
    : [event.location, event.prefecture].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Kegiatan"
        title={event.title}
        meta={[formatDateTimeID(event.event_date), place]
          .filter(Boolean)
          .join(" · ")}
      />
    ),
    size,
  );
}
