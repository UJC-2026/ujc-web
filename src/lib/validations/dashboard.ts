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
