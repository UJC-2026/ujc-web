"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type CreativeState = { error?: string; success?: string };

const schema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(120),
  description: z
    .string()
    .trim()
    .max(600, "Deskripsi maksimal 600 karakter.")
    .transform((v) => v || null)
    .nullable(),
  url: z.url("Tautan harus berupa URL lengkap (diawali https://)."),
});

/**
 * Platform detection, the YouTube id, and the approval gate all live in the
 * database trigger (0026) — this only turns rejections into readable copy.
 */
export async function submitWork(
  _prev: CreativeState,
  formData: FormData,
): Promise<CreativeState> {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    url: formData.get("url"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk membagikan karyamu." };

  const { error } = await supabase.from("creative_works").insert({
    submitted_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    url: parsed.data.url,
  });

  if (error) {
    return {
      error: error.message.startsWith("Karya harus")
        ? error.message
        : "Karya gagal diajukan. Coba lagi.",
    };
  }

  revalidatePath("/creative-hub");
  return {
    success: "Terkirim! Pengurus akan meninjau dulu sebelum karyamu tampil.",
  };
}

/** Moderator-only; RLS and the guard trigger both reject anyone else. */
export async function curateWork(formData: FormData): Promise<void> {
  const id = String(formData.get("workId"));
  const action = String(formData.get("curate"));

  const supabase = await createClient();

  const patch =
    action === "approve"
      ? { is_approved: true }
      : action === "feature"
        ? { is_featured: true }
        : action === "unfeature"
          ? { is_featured: false }
          : { is_approved: false, is_featured: false };

  const { data } = await supabase
    .from("creative_works")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (data) {
    await supabase.rpc("log_audit", {
      p_action: `karya.${action}`,
      p_target_type: "creative_work",
      p_target_id: id,
    });
  }

  revalidatePath("/creative-hub");
}

export async function deleteWork(formData: FormData): Promise<void> {
  const id = String(formData.get("workId"));

  const supabase = await createClient();
  // RLS: pemilik atau moderator.
  await supabase.from("creative_works").delete().eq("id", id);

  revalidatePath("/creative-hub");
}
