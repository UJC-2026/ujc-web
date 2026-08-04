"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MentorshipState = { error?: string; success?: string };

/** Surfaces the trigger's own wording; anything else gets a generic line. */
function friendly(message: string, fallback: string) {
  const known = ["Mentor", "Kamu tidak bisa", "Kuota mentor"];
  if (known.some((prefix) => message.startsWith(prefix))) return message;
  if (message.includes("mentorship_requests_active_unique_idx")) {
    return "Kamu sudah punya permintaan yang masih berjalan ke mentor ini.";
  }
  return fallback;
}

const mentorSchema = z.object({
  expertise: z.array(z.string().trim().min(1)).max(8),
  city: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
  experienceSummary: z
    .string()
    .trim()
    .min(20, "Ceritakan pengalamanmu minimal 20 karakter.")
    .max(2000, "Ringkasan maksimal 2000 karakter."),
  capacity: z
    .string()
    .trim()
    .transform((value) => Number(value || 3))
    .refine(
      (value) => Number.isInteger(value) && value >= 1 && value <= 10,
      "Kuota bimbingan antara 1 sampai 10 orang.",
    ),
  isAvailable: z.enum(["true", "false"]).default("true"),
});

export async function upsertMentorProfile(
  _prev: MentorshipState,
  formData: FormData,
): Promise<MentorshipState> {
  const parsed = mentorSchema.safeParse({
    expertise: formData.getAll("expertise").map(String).filter(Boolean),
    city: formData.get("city"),
    experienceSummary: formData.get("experienceSummary"),
    capacity: formData.get("capacity"),
    isAvailable: formData.get("isAvailable") ?? "false",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk mendaftar sebagai mentor." };

  const { error } = await supabase.from("mentors").upsert(
    {
      user_id: user.id,
      expertise: parsed.data.expertise,
      city: parsed.data.city,
      experience_summary: parsed.data.experienceSummary,
      capacity: parsed.data.capacity,
      is_available: parsed.data.isAvailable === "true",
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: "Profil mentor gagal disimpan. Coba lagi." };

  revalidatePath("/mentorship");
  return { success: "Profil mentormu tersimpan." };
}

const requestSchema = z.object({
  mentorId: z.uuid(),
  message: z
    .string()
    .trim()
    .min(20, "Ceritakan apa yang ingin kamu pelajari, minimal 20 karakter.")
    .max(1000, "Pesan maksimal 1000 karakter."),
});

export async function requestMentoring(
  _prev: MentorshipState,
  formData: FormData,
): Promise<MentorshipState> {
  const parsed = requestSchema.safeParse({
    mentorId: formData.get("mentorId"),
    message: formData.get("message"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk mengajukan bimbingan." };

  const { error } = await supabase.from("mentorship_requests").insert({
    mentor_id: parsed.data.mentorId,
    mentee_id: user.id,
    message: parsed.data.message,
  });

  if (error) {
    return {
      error: friendly(error.message, "Permintaan gagal dikirim. Coba lagi."),
    };
  }

  // The mentor is notified by a database trigger (migration 0022).

  revalidatePath("/mentorship");
  return { success: "Permintaanmu terkirim. Tunggu jawaban mentor, ya." };
}

const answerSchema = z.object({
  requestId: z.uuid(),
  status: z.enum(["diterima", "ditolak", "selesai"]),
});

/** Mentor-only; RLS restricts the update to the mentor who owns the request. */
export async function answerRequest(
  _prev: MentorshipState,
  formData: FormData,
): Promise<MentorshipState> {
  const parsed = answerSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: "Aksi tidak dikenali." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { data, error } = await supabase
    .from("mentorship_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.requestId)
    .select("id, mentee_id, status")
    .maybeSingle();

  if (error) {
    return {
      error: friendly(error.message, "Jawaban gagal disimpan. Coba lagi."),
    };
  }
  if (!data) return { error: "Hanya mentor terkait yang bisa menjawab ini." };

  // The mentee is notified by a database trigger (migration 0022).

  revalidatePath("/mentorship");

  const messages = {
    diterima: "Permintaan diterima. Mentee sudah diberi tahu.",
    ditolak: "Permintaan ditolak. Mentee sudah diberi tahu.",
    selesai: "Bimbingan ditandai selesai.",
  } as const;

  return { success: messages[parsed.data.status] };
}

export async function withdrawRequest(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mentorship");

  // RLS lets a mentee delete only their own row.
  await supabase
    .from("mentorship_requests")
    .delete()
    .eq("id", requestId)
    .eq("mentee_id", user.id);

  revalidatePath("/mentorship");
}
