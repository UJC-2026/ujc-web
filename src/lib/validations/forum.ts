import { z } from "zod";

/** Tiptap emits "<p></p>" for an empty document. */
const nonEmptyRichText = z
  .string()
  .trim()
  .refine(
    (html) => html.replace(/<[^>]*>/g, "").trim().length > 0,
    "Isi tulisan belum boleh kosong.",
  );

export const threadSchema = z.object({
  categoryId: z.uuid("Pilih kategori forum."),
  title: z
    .string()
    .trim()
    .min(10, "Judul minimal 10 karakter.")
    .max(160, "Judul maksimal 160 karakter."),
  content: nonEmptyRichText,
  tags: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9-]{2,20}$/, "Tag hanya huruf, angka, dan tanda hubung."),
    )
    .max(5, "Maksimal 5 tag per thread."),
});

export const replySchema = z.object({
  threadId: z.uuid(),
  parentReplyId: z.uuid().nullable(),
  content: nonEmptyRichText,
});

export const reportSchema = z.object({
  contentType: z.enum(["thread", "reply"]),
  contentId: z.uuid(),
  reason: z
    .string()
    .trim()
    .min(10, "Jelaskan alasannya minimal 10 karakter.")
    .max(500, "Alasan maksimal 500 karakter."),
});

export type ThreadInput = z.infer<typeof threadSchema>;

/** Turns a free-text tag field ("#visa, kerja") into a clean tag array. */
export function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,\s]+/)
        .map((tag) => tag.replace(/^#/, "").trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 5);
}
