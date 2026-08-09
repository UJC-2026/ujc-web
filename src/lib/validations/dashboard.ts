import { z } from "zod";

export const DIVISI_VALUES = [
  "ketua",
  "wakil",
  "sekretaris",
  "bendahara",
  "media",
  "pendidikan",
  "acara",
] as const;

/** Empty form fields arrive as "", which should mean "not set", not "invalid". */
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable();

const optionalDate = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    "Tanggal tidak valid.",
  );

export const programSchema = z
  .object({
    divisi: z.enum(DIVISI_VALUES),
    title: z
      .string()
      .trim()
      .min(4, "Judul proker minimal 4 karakter.")
      .max(140, "Judul proker maksimal 140 karakter."),
    description: optionalText,
    target: optionalText,
    startDate: optionalDate,
    endDate: optionalDate,
    budget: z
      .string()
      .trim()
      .transform((value) => (value ? Number(value) : null))
      .refine(
        (value) => value === null || (Number.isInteger(value) && value >= 0),
        "Anggaran harus berupa angka bulat tidak negatif.",
      ),
    status: z.enum(["rencana", "berjalan", "selesai", "tertunda"]),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      Date.parse(data.startDate) <= Date.parse(data.endDate),
    { message: "Tanggal selesai tidak boleh mendahului tanggal mulai.", path: ["endDate"] },
  );

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Judul tugas minimal 4 karakter.")
    .max(140, "Judul tugas maksimal 140 karakter."),
  description: optionalText,
  programId: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .refine(
      (value) => value === null || z.uuid().safeParse(value).success,
      "Proker tidak dikenali.",
    ),
  assignedTo: z.uuid("Pilih penanggung jawab tugas."),
  dueDate: optionalDate,
  priority: z.enum(["rendah", "sedang", "tinggi"]),
});

export const taskStatusSchema = z.object({
  taskId: z.uuid(),
  status: z.enum(["todo", "dikerjakan", "selesai"]),
});

export const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Judul notulen minimal 4 karakter.")
    .max(140, "Judul notulen maksimal 140 karakter."),
  content: optionalText,
  meetingDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Tanggal tidak valid."),
});

export const contentSlotSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Judul konten minimal 4 karakter.")
    .max(140, "Judul konten maksimal 140 karakter."),
  type: optionalText,
  scheduledAt: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Jadwal tidak valid."),
  status: z.enum(["rencana", "proses", "terbit"]),
});

export const boardPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Judul minimal 4 karakter.")
    .max(140, "Judul maksimal 140 karakter."),
  content: z
    .string()
    .trim()
    .min(4, "Isi pesan minimal 4 karakter.")
    .max(4000, "Isi pesan maksimal 4000 karakter."),
  isPinned: z.enum(["true", "false"]).default("false"),
});

export const boardReplySchema = z.object({
  boardId: z.uuid(),
  content: z
    .string()
    .trim()
    .min(2, "Balasan minimal 2 karakter.")
    .max(2000, "Balasan maksimal 2000 karakter."),
});

export const calendarEntrySchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Judul minimal 4 karakter.")
    .max(140, "Judul maksimal 140 karakter."),
  type: z.enum(["rapat", "event", "deadline", "penting"]),
  startAt: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Waktu tidak valid."),
});

export const cashSchema = z.object({
  type: z.enum(["pemasukan", "pengeluaran"]),
  category: optionalText,
  amount: z
    .string()
    .trim()
    .transform((value) => Number(value))
    .refine(
      (value) => Number.isInteger(value) && value > 0,
      "Jumlah harus berupa angka bulat lebih dari 0.",
    ),
  description: optionalText,
  occurredOn: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Tanggal tidak valid."),
});

/**
 * Wording for the weekend academic reminder (migration 0033).
 *
 * Blank fields become null so the notification falls back to its built-in
 * wording — clearing a box should restore the default, not save an empty
 * reminder.
 *
 * The link must be site-relative. It becomes the notification's target, so an
 * absolute URL would let whoever holds the Akademik panel point every member's
 * reminder anywhere they like.
 *
 * A leading slash alone is not enough: `//evil.example` is protocol-relative
 * and a browser sends it straight off-site, and some treat `/\evil.example`
 * the same way. The second character has to be neither slash nor backslash.
 */
const INTERNAL_PATH = /^\/(?![/\\])/;

export const academicReminderSchema = z.object({
  title: z.string().trim().max(120, "Judul maksimal 120 karakter."),
  body: z.string().trim().max(300, "Isi maksimal 300 karakter."),
  link: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || INTERNAL_PATH.test(value),
      "Tautan harus jalur internal yang diawali “/”, misalnya /cbt.",
    ),
});

/**
 * An organisation document. `path` is a key inside the private `documents`
 * bucket, never a URL: the bucket is not public, so anything stored as a link
 * would be dead when someone clicked it.
 *
 * The shape is checked because the value arrives from the browser. The storage
 * policy already refuses a write outside the uploader's own folder, but this
 * row is what the archive renders, and a path that never matched an upload
 * would sit there as a permanently broken entry.
 */
export const documentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul dokumen minimal 3 karakter.")
    .max(160, "Judul maksimal 160 karakter."),
  category: optionalText,
  path: z
    .string()
    .trim()
    .refine(
      (value) => /^[0-9a-f-]{36}\/[0-9a-z-]+\.[a-z0-9]+$/i.test(value),
      "Pilih berkas yang akan diunggah dulu.",
    ),
});
