"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { youtubeId } from "@/lib/home/queries";

export type HomeContentState = { error?: string; success?: string };

const videoSchema = z.object({
  url: z.string().trim(),
});

/**
 * Sets (or clears) the community profile video on the homepage.
 *
 * The URL is validated into a YouTube id before it is stored, so the settings
 * row can only ever hold something the embed will accept — the alternative is
 * discovering on the landing page that someone pasted a Drive link.
 *
 * RLS on `site_settings` is what restricts this to admin and divisi media.
 */
export async function saveHomeVideo(
  _prev: HomeContentState,
  formData: FormData,
): Promise<HomeContentState> {
  const parsed = videoSchema.safeParse({ url: formData.get("url") });
  if (!parsed.success) return { error: "Tautan tidak terbaca." };

  const raw = parsed.data.url;

  if (raw && !youtubeId(raw)) {
    return {
      error:
        "Tautan harus video YouTube (youtube.com/watch, youtu.be, atau /shorts).",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "home_video_url", value: raw || null }, { onConflict: "key" });

  if (error) {
    return { error: "Gagal disimpan. Hanya admin dan divisi media yang bisa." };
  }

  revalidatePath("/");
  revalidatePath("/admin/beranda");

  return {
    success: raw ? "Video profil tersimpan." : "Video profil dikosongkan.",
  };
}

const partnerSchema = z.object({
  name: z.string().trim().min(2, "Nama partner minimal 2 karakter.").max(120),
  websiteUrl: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\//.test(v), "Tautan harus diawali https://"),
  logoUrl: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\//.test(v), "Tautan logo harus diawali https://"),
  description: z.string().trim().max(200, "Deskripsi maksimal 200 karakter."),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export async function addPartner(
  _prev: HomeContentState,
  formData: FormData,
): Promise<HomeContentState> {
  const parsed = partnerSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    description: formData.get("description") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("partners").insert({
    name: parsed.data.name,
    website_url: parsed.data.websiteUrl || null,
    logo_url: parsed.data.logoUrl || null,
    description: parsed.data.description || null,
    sort_order: parsed.data.sortOrder,
  });

  if (error) {
    return { error: "Gagal ditambahkan. Hanya admin dan divisi media yang bisa." };
  }

  await supabase.rpc("log_audit", {
    p_action: "partner.tambah",
    p_target_type: "partner",
  });

  revalidatePath("/");
  revalidatePath("/admin/beranda");
  return { success: `Partner "${parsed.data.name}" ditambahkan.` };
}

export async function deletePartner(formData: FormData): Promise<void> {
  const id = String(formData.get("partnerId"));

  const supabase = await createClient();
  // RLS decides whether this removes anything.
  const { data } = await supabase
    .from("partners")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (data) {
    await supabase.rpc("log_audit", {
      p_action: "partner.hapus",
      p_target_type: "partner",
      p_target_id: id,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/beranda");
}
