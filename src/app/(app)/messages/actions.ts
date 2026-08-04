"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MessageState = { error?: string; success?: string };

/** Surfaces the database's own wording when it is meant for the user. */
function friendly(message: string, fallback: string) {
  return message.startsWith("Pesan tidak bisa") ||
    message.startsWith("Percakapan tidak bisa") ||
    message.startsWith("Tidak bisa memulai") ||
    message.startsWith("Anggota tidak")
    ? message
    : fallback;
}

/** Opens (or reuses) a thread with another member and goes to it. */
export async function openConversation(formData: FormData): Promise<void> {
  const otherId = String(formData.get("otherId"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/members/${otherId}`);

  const { data, error } = await supabase.rpc("start_direct_conversation", {
    other_user: otherId,
  });

  if (error || !data) redirect("/messages?error=mulai");
  redirect(`/messages/${data}`);
}

const sendSchema = z.object({
  conversationId: z.uuid(),
  content: z
    .string()
    .trim()
    .min(1, "Pesan tidak boleh kosong.")
    .max(4000, "Pesan maksimal 4000 karakter."),
});

export async function sendMessage(
  _prev: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const parsed = sendSchema.safeParse({
    conversationId: formData.get("conversationId"),
    content: formData.get("content"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { error } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    return { error: friendly(error.message, "Pesan gagal terkirim. Coba lagi.") };
  }

  revalidatePath(`/messages/${parsed.data.conversationId}`);
  revalidatePath("/messages");
  return { success: "Terkirim." };
}

export async function markRead(formData: FormData): Promise<void> {
  const conversationId = String(formData.get("conversationId"));

  const supabase = await createClient();
  await supabase.rpc("mark_conversation_read", { target: conversationId });

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
}

export async function toggleBlock(formData: FormData): Promise<void> {
  const otherId = String(formData.get("otherId"));
  const blocked = formData.get("blocked") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (blocked) {
    await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", otherId);
  } else {
    await supabase
      .from("user_blocks")
      .insert({ blocker_id: user.id, blocked_id: otherId });
  }

  revalidatePath("/messages");
}
