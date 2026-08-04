"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type PeduliState = { error?: string; success?: string };

const caseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Judul pengajuan minimal 8 karakter.")
    .max(140, "Judul pengajuan maksimal 140 karakter."),
  category: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
  description: z
    .string()
    .trim()
    .min(20, "Ceritakan situasinya minimal 20 karakter.")
    .max(3000, "Cerita maksimal 3000 karakter."),
  targetAmount: z
    .string()
    .trim()
    .transform((value) => (value ? Number(value) : null))
    .refine(
      (value) => value === null || (Number.isInteger(value) && value > 0),
      "Target dana harus berupa angka bulat lebih dari 0.",
    ),
});

/**
 * Members submit; a case stays private and unverified until pengurus publish
 * it. RLS enforces both (`NOT is_public`, `status = 'pengajuan'`), so this
 * cannot be bypassed by posting a different payload.
 */
export async function submitPeduliCase(
  _prev: PeduliState,
  formData: FormData,
): Promise<PeduliState> {
  const parsed = caseSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
    targetAmount: formData.get("targetAmount"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk mengajukan bantuan." };

  const { error } = await supabase.from("peduli_cases").insert({
    title: parsed.data.title,
    category: parsed.data.category,
    description: parsed.data.description,
    target_amount: parsed.data.targetAmount,
    submitted_by: user.id,
  });

  if (error) {
    return { error: "Pengajuan gagal dikirim. Coba lagi sebentar lagi." };
  }

  revalidatePath("/peduli");
  return {
    success:
      "Pengajuanmu terkirim dan akan ditinjau pengurus dulu sebelum tampil. Ceritamu belum terlihat anggota lain.",
  };
}

const reviewSchema = z.object({
  caseId: z.uuid(),
  decision: z.enum(["terbitkan", "sembunyikan", "mulai", "tuntaskan"]),
});

/**
 * Publishing is the moment a private hardship becomes visible to the whole
 * community, so it is a deliberate, logged step. RLS restricts the update to
 * pimpinan; this turns a silent rejection into a readable message.
 */
export async function reviewPeduliCase(
  _prev: PeduliState,
  formData: FormData,
): Promise<PeduliState> {
  const parsed = reviewSchema.safeParse({
    caseId: formData.get("caseId"),
    decision: formData.get("decision"),
  });

  if (!parsed.success) return { error: "Aksi tinjauan tidak dikenali." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const patch: Record<string, unknown> = { verified_by: user.id };

  switch (parsed.data.decision) {
    case "terbitkan":
      patch.is_public = true;
      patch.status = "diverifikasi";
      break;
    case "sembunyikan":
      patch.is_public = false;
      break;
    case "mulai":
      patch.status = "berjalan";
      patch.is_public = true;
      break;
    case "tuntaskan":
      patch.status = "selesai";
      break;
  }

  const { data, error } = await supabase
    .from("peduli_cases")
    .update(patch)
    .eq("id", parsed.data.caseId)
    .select("id, is_public, status")
    .maybeSingle();

  if (error || !data) {
    return {
      error:
        "Perubahan gagal disimpan. Hanya ketua, wakil, atau admin yang boleh meninjau pengajuan.",
    };
  }

  await supabase.rpc("log_audit", {
    p_action: `peduli.${parsed.data.decision}`,
    p_target_type: "peduli_case",
    p_target_id: parsed.data.caseId,
    p_metadata: { is_public: data.is_public, status: data.status },
  });

  revalidatePath("/dashboard");
  revalidatePath("/peduli");
  revalidatePath(`/peduli/${parsed.data.caseId}`);

  const messages = {
    terbitkan: "Pengajuan diterbitkan dan kini terlihat anggota.",
    sembunyikan: "Pengajuan disembunyikan kembali dari anggota.",
    mulai: "Program ditandai sedang berjalan.",
    tuntaskan: "Program ditandai selesai. Terima kasih!",
  } as const;

  return { success: messages[parsed.data.decision] };
}

const donationSchema = z.object({
  caseId: z.uuid(),
  amount: z
    .string()
    .trim()
    .transform((value) => Number(value))
    .refine(
      (value) => Number.isInteger(value) && value > 0,
      "Nominal donasi harus berupa angka bulat lebih dari 0.",
    ),
  message: z
    .string()
    .trim()
    .max(300, "Pesan maksimal 300 karakter.")
    .transform((value) => value || null)
    .nullable(),
  isAnonymous: z.enum(["true", "false"]).default("false"),
});

export async function donate(
  _prev: PeduliState,
  formData: FormData,
): Promise<PeduliState> {
  const parsed = donationSchema.safeParse({
    caseId: formData.get("caseId"),
    amount: formData.get("amount"),
    message: formData.get("message"),
    isAnonymous: formData.get("isAnonymous") ?? "false",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk berdonasi." };

  const { data: target } = await supabase
    .from("peduli_cases")
    .select("id, status, is_public")
    .eq("id", parsed.data.caseId)
    .maybeSingle();

  if (!target || !target.is_public) {
    return { error: "Program bantuan ini tidak menerima donasi." };
  }
  if (target.status === "selesai") {
    return { error: "Program bantuan ini sudah ditutup. Terima kasih!" };
  }

  const { error } = await supabase.from("peduli_donations").insert({
    case_id: parsed.data.caseId,
    donor_id: user.id,
    amount: parsed.data.amount,
    message: parsed.data.message,
    is_anonymous: parsed.data.isAnonymous === "true",
  });

  if (error) return { error: "Donasi gagal dicatat. Coba lagi." };

  revalidatePath(`/peduli/${parsed.data.caseId}`);
  revalidatePath("/peduli");

  return { success: "Terima kasih, donasimu tercatat." };
}
