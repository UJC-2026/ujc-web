"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/profile";

export type ProfileState = { error?: string; success?: string };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    nim: formData.get("nim"),
    kelas: formData.get("kelas"),
    major: formData.get("major"),
    angkatan: formData.get("angkatan"),
    prefecture: formData.get("prefecture"),
    city: formData.get("city"),
    avatar_url: formData.get("avatar_url"),
    bio: formData.get("bio") || undefined,
    motto: formData.get("motto") || undefined,
    is_profile_public: formData.get("is_profile_public") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "NIM ini sudah dipakai akun lain. Periksa lagi, ya."
          : "Profil gagal disimpan. Coba lagi sebentar lagi.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "Profil berhasil disimpan." };
}
