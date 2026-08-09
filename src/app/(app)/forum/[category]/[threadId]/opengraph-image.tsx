import { ImageResponse } from "next/og";
import { getCategoryBySlug, getThreadById } from "@/lib/forum/queries";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";

export const alt = "Diskusi di forum UNSIA Japan Community";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ category: string; threadId: string }>;
}) {
  const { category: slug, threadId } = await params;

  const [thread, category] = await Promise.all([
    getThreadById(threadId),
    getCategoryBySlug(slug),
  ]);

  if (!thread) {
    return new ImageResponse(
      <OgCard eyebrow="Forum" title="Diskusi UJC" />,
      size,
    );
  }

  const replies =
    thread.reply_count === 0
      ? "Belum ada balasan"
      : `${thread.reply_count} balasan`;

  return new ImageResponse(
    (
      <OgCard
        eyebrow={category ? `Forum · ${category.name}` : "Forum"}
        title={thread.title}
        meta={[thread.author?.full_name, replies].filter(Boolean).join(" · ")}
      />
    ),
    size,
  );
}
