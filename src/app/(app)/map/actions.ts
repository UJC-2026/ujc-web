"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MapState = { error?: string; success?: string };

const schema = z.object({
  prefecture: z.string().trim().min(1, "Pilih prefektur domisilimu."),
  city: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
  isVisible: z.enum(["true", "false"]).default("false"),
});

/**
 * Stores prefecture and city only. Coordinates are deliberately not collected:
 * the map plots fixed prefecture centroids, so exact positions serve no
 * purpose here and would only be something to leak.
 */
export async function saveLocation(
  _prev: MapState,
  formData: FormData,
): Promise<MapState> {
  const parsed = schema.safeParse({
    prefecture: formData.get("prefecture"),
    city: formData.get("city"),
    isVisible: formData.get("isVisible") ?? "false",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { error } = await supabase.from("member_locations").upsert(
    {
      user_id: user.id,
      prefecture: parsed.data.prefecture,
      city: parsed.data.city,
      is_visible: parsed.data.isVisible === "true",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: "Domisili gagal disimpan. Coba lagi." };

  revalidatePath("/map");
  return {
    success:
      parsed.data.isVisible === "true"
        ? "Domisilimu tersimpan dan ikut dihitung di peta."
        : "Domisilimu tersimpan dan tidak ditampilkan di peta.",
  };
}
