"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type BusinessState = { error?: string; success?: string };

function friendly(message: string, fallback: string) {
  return message.startsWith("Bisnis harus") || message.startsWith("Hanya pengurus")
    ? message
    : fallback;
}

const schema = z.object({
  name: z.string().trim().min(2, "Nama usaha wajib diisi.").max(120),
  category: z.string().trim().transform((v) => v || null).nullable(),
  description: z
    .string()
    .trim()
    .min(20, "Jelaskan layananmu minimal 20 karakter.")
    .max(1000, "Deskripsi maksimal 1000 karakter."),
  contact: z.string().trim().transform((v) => v || null).nullable(),
  city: z.string().trim().transform((v) => v || null).nullable(),
  images: z.array(z.string().url()).max(4),
});

/**
 * Listings always land unverified — the guard trigger (0024) enforces it, so
 * this only turns a rejection into a readable sentence.
 */
export async function submitBusiness(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    contact: formData.get("contact"),
    city: formData.get("city"),
    images: formData.getAll("images").map(String).filter(Boolean),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk mendaftarkan usaha." };

  const { error } = await supabase.from("businesses").insert({
    owner_id: user.id,
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description,
    contact: parsed.data.contact,
    city: parsed.data.city,
    images: parsed.data.images,
  });

  if (error) {
    return { error: friendly(error.message, "Usaha gagal didaftarkan. Coba lagi.") };
  }

  revalidatePath("/business");
  return {
    success: "Terkirim. Pengurus akan meninjau dulu sebelum usahamu tampil.",
  };
}

/** Moderator-only; RLS and the guard trigger both reject anyone else. */
export async function verifyBusiness(formData: FormData): Promise<void> {
  const id = String(formData.get("businessId"));
  const verified = formData.get("verified") === "true";

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .update({ is_verified: !verified })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (data) {
    await supabase.rpc("log_audit", {
      p_action: verified ? "bisnis.batal_verifikasi" : "bisnis.verifikasi",
      p_target_type: "business",
      p_target_id: id,
    });
  }

  revalidatePath("/business");
}
