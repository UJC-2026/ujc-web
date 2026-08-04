"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type WorkshopState = { error?: string; success?: string };

/**
 * Capacity and the registration deadline are enforced by a database trigger
 * (0024), because the table is reachable directly. This surfaces its message.
 */
export async function toggleRegistration(
  _prev: WorkshopState,
  formData: FormData,
): Promise<WorkshopState> {
  const workshopId = String(formData.get("workshopId"));
  const registered = formData.get("registered") === "true";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/workshops");

  if (registered) {
    await supabase
      .from("workshop_registrations")
      .delete()
      .eq("workshop_id", workshopId)
      .eq("user_id", user.id);

    revalidatePath("/workshops");
    return { success: "Pendaftaranmu dibatalkan." };
  }

  const { error } = await supabase
    .from("workshop_registrations")
    .insert({ workshop_id: workshopId, user_id: user.id });

  if (error) {
    const known =
      error.message.startsWith("Kuota workshop") ||
      error.message.startsWith("Workshop ini");
    return {
      error: known ? error.message : "Pendaftaran gagal. Coba lagi sebentar lagi.",
    };
  }

  revalidatePath("/workshops");
  return { success: "Kamu terdaftar. Sampai jumpa di acaranya!" };
}
