"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type CheckinState = {
  error?: string;
  success?: string;
  certificateNumber?: string;
};

const checkinSchema = z.object({
  eventId: z.uuid(),
  code: z.string().trim().min(1, "Isi kode kehadiran dulu."),
  method: z.enum(["qr", "kode"]).default("kode"),
});

/**
 * Every rule — the code, the open window, the one-row-per-member limit — is
 * enforced by `checkin_event()` in migration 0027, because members hold no
 * insert policy on `event_checkins` and the code is not readable from the
 * client at all. This turns the function's raise messages, which are already
 * written for members, into form state.
 */
export async function checkinEvent(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const parsed = checkinSchema.safeParse({
    eventId: formData.get("eventId"),
    code: formData.get("code"),
    method: formData.get("method") ?? "kode",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/events/${parsed.data.eventId}`);

  const { data, error } = await supabase.rpc("checkin_event", {
    p_event_id: parsed.data.eventId,
    p_code: parsed.data.code,
    p_method: parsed.data.method,
  });

  if (error) {
    // The function raises copy meant for members; anything else is a fault on
    // our side and should not be shown verbatim.
    const known =
      error.message.startsWith("Kode kehadiran") ||
      error.message.startsWith("Absensi") ||
      error.message.startsWith("Masuk dulu") ||
      error.message.startsWith("Kegiatan tidak");

    return {
      error: known ? error.message : "Absensi gagal dicatat. Coba lagi.",
    };
  }

  revalidatePath(`/events/${parsed.data.eventId}`);

  return {
    success: "Kehadiranmu tercatat. E-sertifikat sudah terbit.",
    certificateNumber: (data as string | null) ?? undefined,
  };
}

const codeSchema = z.object({
  eventId: z.uuid(),
  code: z
    .string()
    .trim()
    .min(4, "Kode minimal 4 karakter.")
    .max(24, "Kode maksimal 24 karakter."),
});

/**
 * Divisi acara sets or rotates the code. RLS on `event_checkin_codes` is what
 * actually keeps this to them; the upsert simply reports the refusal.
 */
export async function setCheckinCode(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const parsed = codeSchema.safeParse({
    eventId: formData.get("eventId"),
    code: formData.get("code"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_checkin_codes")
    .upsert(
      { event_id: parsed.data.eventId, code: parsed.data.code },
      { onConflict: "event_id" },
    );

  if (error) {
    return { error: "Kode gagal disimpan. Hanya divisi acara yang bisa." };
  }

  revalidatePath(`/events/${parsed.data.eventId}`);
  return { success: "Kode kehadiran tersimpan." };
}
