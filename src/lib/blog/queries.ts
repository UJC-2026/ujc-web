import { createClient } from "@/lib/supabase/server";

export type PublishStatus = "draft" | "ditinjau" | "terbit";

export type BlogPost = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  category: string | null;
  tags: string[];
  status: PublishStatus;
  published_at: string | null;
  created_at: string;
  author: { id: string; full_name: string; avatar_url: string | null } | null;
  likeCount: number;
  commentCount: number;
};

const AUTHOR = "author:profiles!blog_posts_author_id_fkey(id, full_name, avatar_url)";

function normalize(row: Record<string, unknown>): Omit<BlogPost, "likeCount" | "commentCount"> {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    ...(row as unknown as BlogPost),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    author: (author as BlogPost["author"]) ?? null,
  };
}

/**
 * Likes and comments are publicly readable, so their counts are gathered in
 * two extra queries rather than one per post.
 */
async function withCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Record<string, unknown>[],
): Promise<BlogPost[]> {
  const base = rows.map(normalize);
  if (base.length === 0) return [];

  const ids = base.map((post) => post.id);

  const [likes, comments] = await Promise.all([
    supabase.from("blog_likes").select("post_id").in("post_id", ids),
    supabase.from("blog_comments").select("post_id").in("post_id", ids),
  ]);

  const tally = (data: { post_id: unknown }[] | null) => {
    const map = new Map<string, number>();
    for (const row of data ?? []) {
      const key = row.post_id as string;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };

  const likeMap = tally(likes.data);
  const commentMap = tally(comments.data);

  return base.map((post) => ({
    ...post,
    likeCount: likeMap.get(post.id) ?? 0,
    commentCount: commentMap.get(post.id) ?? 0,
  }));
}

/**
 * RLS returns published articles plus the caller's own drafts and, for
 * pengurus, everything awaiting review — so no status filter is applied here.
 */
export async function getPosts(category?: string): Promise<BlogPost[]> {
  const supabase = await createClient();

  let query = supabase
    .from("blog_posts")
    .select(`*, ${AUTHOR}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data } = await query;
  return withCounts(supabase, (data ?? []) as Record<string, unknown>[]);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(`*, ${AUTHOR}`)
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  const [post] = await withCounts(supabase, [data as Record<string, unknown>]);
  return post ?? null;
}

export async function getBlogCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("status", "terbit");

  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.category) set.add(row.category as string);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "id"));
}

export type BlogComment = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: { id: string; full_name: string; avatar_url: string | null } | null;
};

export async function getComments(postId: string): Promise<BlogComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_comments")
    .select(
      "id, content, created_at, author_id, author:profiles!blog_comments_author_id_fkey(id, full_name, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    return {
      id: row.id as string,
      content: row.content as string,
      created_at: row.created_at as string,
      author_id: row.author_id as string,
      author: (author as BlogComment["author"]) ?? null,
    };
  });
}

export async function hasLiked(postId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}
