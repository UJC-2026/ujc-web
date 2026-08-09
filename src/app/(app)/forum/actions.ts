"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actionError } from "@/lib/rate-limit";
import { sanitizeRichText } from "@/lib/sanitize";
import {
  parseTags,
  replySchema,
  reportSchema,
  threadSchema,
} from "@/lib/validations/forum";

export type ForumState = { error?: string; success?: string };

/**
 * Runs the keyword filter over new content. A hit is recorded in
 * content_flags for the moderation queue but does not block the post — a
 * moderator decides. Failures here must never break posting.
 */
async function flagIfSuspicious(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contentType: "thread" | "reply",
  contentId: string,
  text: string,
  authorId: string,
) {
  const { data: reason } = await supabase.rpc("match_moderation_keyword", {
    body: text,
  });

  if (!reason) return;

  await supabase.from("content_flags").insert({
    content_type: contentType,
    content_id: contentId,
    reason,
    flagged_by: authorId,
    is_automatic: true,
  });
}

export async function createThread(
  _prev: ForumState,
  formData: FormData,
): Promise<ForumState> {
  const parsed = threadSchema.safeParse({
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    content: formData.get("content"),
    tags: parseTags(String(formData.get("tags") ?? "")),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const content = sanitizeRichText(parsed.data.content);

  const { data: thread, error } = await supabase
    .from("forum_threads")
    .insert({
      category_id: parsed.data.categoryId,
      author_id: user.id,
      title: parsed.data.title,
      content,
      tags: parsed.data.tags,
    })
    .select("id, category_id")
    .single();

  if (error || !thread) {
    return {
      error: actionError(error, "Thread gagal diposting. Coba lagi sebentar lagi."),
    };
  }

  await flagIfSuspicious(
    supabase,
    "thread",
    thread.id,
    `${parsed.data.title} ${content}`,
    user.id,
  );

  const { data: category } = await supabase
    .from("forum_categories")
    .select("slug")
    .eq("id", thread.category_id)
    .single();

  revalidatePath("/forum");
  if (category) revalidatePath(`/forum/${category.slug}`);

  redirect(`/forum/${category?.slug ?? ""}/${thread.id}`);
}

export async function createReply(
  _prev: ForumState,
  formData: FormData,
): Promise<ForumState> {
  const rawParent = formData.get("parentReplyId");

  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    parentReplyId: rawParent ? String(rawParent) : null,
    content: formData.get("content"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("id, is_locked, author_id, title, category_id")
    .eq("id", parsed.data.threadId)
    .maybeSingle();

  if (!thread) return { error: "Thread ini sudah tidak ada." };
  if (thread.is_locked) {
    return { error: "Thread ini sudah dikunci, jadi tidak bisa dibalas." };
  }

  const content = sanitizeRichText(parsed.data.content);

  const { data: reply, error } = await supabase
    .from("forum_replies")
    .insert({
      thread_id: parsed.data.threadId,
      author_id: user.id,
      parent_reply_id: parsed.data.parentReplyId,
      content,
    })
    .select("id")
    .single();

  if (error || !reply) {
    return {
      error: actionError(error, "Balasan gagal dikirim. Coba lagi sebentar lagi."),
    };
  }

  await flagIfSuspicious(supabase, "reply", reply.id, content, user.id);

  const { data: category } = await supabase
    .from("forum_categories")
    .select("slug")
    .eq("id", thread.category_id)
    .single();

  // The reply notification is raised by a database trigger (migration 0022);
  // inserting it from here was silently rejected by RLS.
  revalidatePath(`/forum/${category?.slug ?? ""}/${thread.id}`);
  return { success: "Balasan terkirim." };
}

export async function toggleVote(formData: FormData): Promise<void> {
  const threadId = formData.get("threadId");
  const replyId = formData.get("replyId");
  const vote = formData.get("vote") === "down" ? "down" : "up";
  const path = String(formData.get("path") ?? "/forum");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const target = replyId
    ? { reply_id: String(replyId) }
    : { thread_id: String(threadId) };
  const column = replyId ? "reply_id" : "thread_id";
  const targetId = replyId ? String(replyId) : String(threadId);

  const { data: existing } = await supabase
    .from("forum_votes")
    .select("id, vote")
    .eq("user_id", user.id)
    .eq(column, targetId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("forum_votes").insert({ ...target, user_id: user.id, vote });
  } else if (existing.vote === vote) {
    // Clicking the same arrow again clears the vote.
    await supabase.from("forum_votes").delete().eq("id", existing.id);
  } else {
    await supabase.from("forum_votes").update({ vote }).eq("id", existing.id);
  }

  revalidatePath(path);
}

export async function reportContent(
  _prev: ForumState,
  formData: FormData,
): Promise<ForumState> {
  const parsed = reportSchema.safeParse({
    contentType: formData.get("contentType"),
    contentId: formData.get("contentId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { error } = await supabase.from("reports").insert({
    content_type: parsed.data.contentType,
    content_id: parsed.data.contentId,
    reporter_id: user.id,
    reason: parsed.data.reason,
  });

  if (error) return { error: "Laporan gagal dikirim. Coba lagi." };

  return {
    success: "Terima kasih. Laporanmu sudah masuk antrean moderasi.",
  };
}

/** Moderator-only. RLS rejects the update for anyone else. */
export async function togglePin(formData: FormData): Promise<void> {
  const threadId = String(formData.get("threadId"));
  const pinned = formData.get("pinned") === "true";
  const path = String(formData.get("path") ?? "/forum");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("forum_threads")
    .update({ is_pinned: !pinned })
    .eq("id", threadId);

  // Writing through the RPC rather than the table: RLS rejects direct inserts,
  // and the function stamps actor_id from the session so it cannot be forged.
  await supabase.rpc("log_audit", {
    p_action: pinned ? "forum.unpin" : "forum.pin",
    p_target_type: "thread",
    p_target_id: threadId,
  });

  revalidatePath(path);
}
