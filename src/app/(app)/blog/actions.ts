"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRichText } from "@/lib/sanitize";

export type BlogState = { error?: string; success?: string };

/** Surfaces the publish guard's own wording; anything else stays generic. */
function friendly(message: string, fallback: string) {
  return message.startsWith("Artikel harus") || message.startsWith("Hanya pengurus")
    ? message
    : fallback;
}

/** "Tips kerja di Jepang" -> "tips-kerja-di-jepang", with a short suffix. */
function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${base || "artikel"}-${Math.random().toString(36).slice(2, 7)}`;
}

const nonEmptyRichText = z
  .string()
  .trim()
  .refine(
    (html) => html.replace(/<[^>]*>/g, "").trim().length >= 100,
    "Isi artikel minimal 100 karakter — ini format panjang, bukan thread forum.",
  );

const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Judul minimal 8 karakter.")
    .max(160, "Judul maksimal 160 karakter."),
  category: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
  content: nonEmptyRichText,
  coverImage: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
});

export async function createPost(
  _prev: BlogState,
  formData: FormData,
): Promise<BlogState> {
  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    content: formData.get("content"),
    coverImage: formData.get("coverImage"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      slug: slugify(parsed.data.title),
      category: parsed.data.category,
      cover_image: parsed.data.coverImage,
      content: sanitizeRichText(parsed.data.content),
      // Publishing is a pengurus decision; the DB guard enforces it too.
      status: "ditinjau",
    })
    .select("slug")
    .single();

  if (error || !post) {
    return {
      error: friendly(error?.message ?? "", "Artikel gagal disimpan. Coba lagi."),
    };
  }

  revalidatePath("/blog");
  redirect(`/blog/${post.slug}`);
}

const publishSchema = z.object({
  postId: z.uuid(),
  status: z.enum(["draft", "ditinjau", "terbit"]),
});

/** Pengurus/moderator only — the guard trigger rejects anyone else. */
export async function setPostStatus(
  _prev: BlogState,
  formData: FormData,
): Promise<BlogState> {
  const parsed = publishSchema.safeParse({
    postId: formData.get("postId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: "Status tidak dikenali." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.postId)
    .select("slug, status")
    .maybeSingle();

  if (error) {
    return {
      error: friendly(error.message, "Status gagal diubah. Coba lagi."),
    };
  }
  if (!data) return { error: "Hanya pengurus yang bisa mengubah status ini." };

  await supabase.rpc("log_audit", {
    p_action: `artikel.${parsed.data.status}`,
    p_target_type: "blog_post",
    p_target_id: parsed.data.postId,
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);

  return {
    success:
      parsed.data.status === "terbit"
        ? "Artikel diterbitkan."
        : "Status artikel diperbarui.",
  };
}

export async function toggleLike(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId"));
  const liked = formData.get("liked") === "true";
  const slug = String(formData.get("slug"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/blog/${slug}`);

  if (liked) {
    await supabase
      .from("blog_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("blog_likes")
      .insert({ post_id: postId, user_id: user.id });
  }

  revalidatePath(`/blog/${slug}`);
}

const commentSchema = z.object({
  postId: z.uuid(),
  slug: z.string().min(1),
  content: z
    .string()
    .trim()
    .min(2, "Komentar minimal 2 karakter.")
    .max(2000, "Komentar maksimal 2000 karakter."),
});

export async function addComment(
  _prev: BlogState,
  formData: FormData,
): Promise<BlogState> {
  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    slug: formData.get("slug"),
    content: formData.get("content"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk berkomentar." };

  const { error } = await supabase.from("blog_comments").insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) return { error: "Komentar gagal dikirim. Coba lagi." };

  revalidatePath(`/blog/${parsed.data.slug}`);
  return { success: "Komentar terkirim." };
}
