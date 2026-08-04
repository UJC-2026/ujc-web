"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Starts a fresh conversation and lands the member on it. */
export async function startConversation(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/assistant");

  const { data } = await supabase
    .from("ai_chat_sessions")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  revalidatePath("/assistant");
  if (data) redirect(`/assistant?sesi=${data.id}`);
}

export async function deleteConversation(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("sessionId"));

  const supabase = await createClient();
  // RLS limits the delete to the caller's own conversation.
  await supabase.from("ai_chat_sessions").delete().eq("id", sessionId);

  revalidatePath("/assistant");
  redirect("/assistant");
}
