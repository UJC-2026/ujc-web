"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  // RLS limits the update to the caller's own rows.
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  revalidatePath("/notifications");
}

export async function markOneRead(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));

  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);

  revalidatePath("/notifications");
}

export async function clearRead(): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("is_read", true);

  revalidatePath("/notifications");
}

export async function savePreferences(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const types = formData.getAll("type").map(String);
  const enabled = new Set(formData.getAll("enabled").map(String));

  await supabase.from("notification_preferences").upsert(
    types.map((type) => ({
      user_id: user.id,
      type,
      channel_inapp: enabled.has(type),
    })),
    { onConflict: "user_id,type" },
  );

  revalidatePath("/settings/notifications");
}
