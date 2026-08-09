"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sweepStorageOrphans } from "@/lib/storage/sweep";

export type GalleryState = { error?: string; success?: string };

const uploadSchema = z.object({
  imageUrl: z.string().url("Unggah fotonya dulu."),
  caption: z
    .string()
    .trim()
    .max(200, "Keterangan maksimal 200 karakter.")
    .transform((value) => value || null)
    .nullable(),
});

/**
 * Members upload freely, but never straight to the homepage — the insert
 * policy pins `is_homepage_featured` to false, so featuring stays a separate
 * pengurus decision.
 */
export async function uploadPhoto(
  _prev: GalleryState,
  formData: FormData,
): Promise<GalleryState> {
  const parsed = uploadSchema.safeParse({
    imageUrl: formData.get("imageUrl"),
    caption: formData.get("caption"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk mengunggah foto." };

  const { error } = await supabase.from("gallery_photos").insert({
    uploaded_by: user.id,
    image_url: parsed.data.imageUrl,
    caption: parsed.data.caption,
  });

  if (error) return { error: "Foto gagal disimpan. Coba lagi." };

  revalidatePath("/gallery");
  return { success: "Foto terunggah ke galeri." };
}

/** Pengurus-only; RLS rejects it for anyone else. */
export async function toggleFeatured(formData: FormData): Promise<void> {
  const photoId = String(formData.get("photoId"));
  const featured = formData.get("featured") === "true";

  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_photos")
    .update({ is_homepage_featured: !featured })
    .eq("id", photoId)
    .select("id")
    .maybeSingle();

  if (data) {
    await supabase.rpc("log_audit", {
      p_action: featured ? "galeri.lepas_unggulan" : "galeri.jadikan_unggulan",
      p_target_type: "gallery_photo",
      p_target_id: photoId,
    });
  }

  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function deletePhoto(formData: FormData): Promise<void> {
  const photoId = String(formData.get("photoId"));

  const supabase = await createClient();
  // RLS allows the uploader (own, unfeatured) or pengurus.
  await supabase.from("gallery_photos").delete().eq("id", photoId);

  // Deleting the row is what makes the file an orphan. A pengurus removing
  // someone else's photo only clears their own queue entries — the bucket
  // policy would refuse the rest anyway — so the uploader's next save
  // finishes the job.
  await sweepStorageOrphans(supabase);

  revalidatePath("/gallery");
  revalidatePath("/");
}
