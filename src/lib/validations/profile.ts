import { z } from "zod";

export const PREFECTURES = [
  "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
  "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa",
  "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu",
  "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara",
  "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
  "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga", "Nagasaki",
  "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa",
] as const;

export const profileSchema = z.object({
  full_name: z.string().trim().min(3, "Nama lengkap minimal 3 karakter."),
  nim: z
    .string()
    .trim()
    .regex(/^[0-9]{6,15}$/, "NIM hanya berisi angka (6–15 digit)."),
  kelas: z.string().trim().min(1, "Kelas belum diisi."),
  major: z.string().trim().min(2, "Program studi belum diisi."),
  angkatan: z
    .string()
    .trim()
    .regex(/^20[0-9]{2}$/, "Angkatan berupa tahun, misalnya 2024."),
  prefecture: z.enum(PREFECTURES, { message: "Pilih prefektur domisili." }),
  city: z.string().trim().min(2, "Kota domisili belum diisi."),
  avatar_url: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
  bio: z.string().trim().max(280, "Bio maksimal 280 karakter.").optional(),
  motto: z.string().trim().max(120, "Motto maksimal 120 karakter.").optional(),
  is_profile_public: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** Fields the onboarding wizard treats as "complete" for the progress meter. */
const COMPLETION_FIELDS = [
  "full_name", "nim", "kelas", "major", "angkatan",
  "prefecture", "city", "avatar_url", "bio", "motto",
] as const;

export function profileCompletion(profile: Record<string, unknown>) {
  const filled = COMPLETION_FIELDS.filter((field) => {
    const value = profile[field];
    return typeof value === "string" && value.trim().length > 0;
  }).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}
