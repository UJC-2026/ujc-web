import { createClient } from "@/lib/supabase/server";
import type {
  ForumCategory,
  ForumReply,
  ForumThread,
  ThreadSort,
  ThreadedReply,
} from "./types";
import { THREADS_PER_PAGE } from "./types";

const AUTHOR_FIELDS =
  "author:profiles!forum_threads_author_id_fkey(id, full_name, avatar_url, role, is_verified)";

const REPLY_AUTHOR_FIELDS =
  "author:profiles!forum_replies_author_id_fkey(id, full_name, avatar_url, role, is_verified)";

export async function getCategories(): Promise<ForumCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_categories")
    .select("*")
    .order("sort_order");
  return (data as ForumCategory[] | null) ?? [];
}

export async function getCategoryBySlug(
  slug: string,
): Promise<ForumCategory | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as ForumCategory | null) ?? null;
}

/** Thread counts per category, used for the category cards. */
export async function getCategoryThreadCounts(): Promise<
  Record<string, number>
> {
  const supabase = await createClient();
  const { data } = await supabase.from("forum_threads").select("category_id");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.category_id as string;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export async function getThreads({
  categoryId,
  sort = "terbaru",
  search,
  page = 1,
}: {
  categoryId?: string;
  sort?: ThreadSort;
  search?: string;
  page?: number;
}): Promise<{ threads: ForumThread[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("forum_threads")
    .select(`*, ${AUTHOR_FIELDS}`, { count: "exact" });

  if (categoryId) query = query.eq("category_id", categoryId);

  if (search?.trim()) {
    const term = search.trim().replace(/[%,]/g, "");
    query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
  }

  if (sort === "belum_dijawab") query = query.eq("reply_count", 0);

  // Pinned threads always float to the top of the first ordering key.
  query = query.order("is_pinned", { ascending: false });

  if (sort === "populer") {
    query = query
      .order("score", { ascending: false })
      .order("reply_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * THREADS_PER_PAGE;
  const { data, count } = await query.range(from, from + THREADS_PER_PAGE - 1);

  return {
    threads: (data as ForumThread[] | null) ?? [],
    total: count ?? 0,
  };
}

export async function getThreadById(id: string): Promise<ForumThread | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_threads")
    .select(`*, ${AUTHOR_FIELDS}`)
    .eq("id", id)
    .maybeSingle();
  return (data as ForumThread | null) ?? null;
}

/**
 * Loads every reply for a thread and nests them two levels deep. Replies
 * deeper than that are attached to their top-level ancestor so nothing is
 * silently dropped from the page.
 */
export async function getThreadReplies(
  threadId: string,
): Promise<ThreadedReply[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_replies")
    .select(`*, ${REPLY_AUTHOR_FIELDS}`)
    .eq("thread_id", threadId)
    .order("created_at");

  const replies = (data as ForumReply[] | null) ?? [];
  const byId = new Map(replies.map((reply) => [reply.id, reply]));

  const roots: ThreadedReply[] = [];
  const rootById = new Map<string, ThreadedReply>();

  for (const reply of replies) {
    if (!reply.parent_reply_id) {
      const root: ThreadedReply = { ...reply, children: [] };
      roots.push(root);
      rootById.set(reply.id, root);
    }
  }

  for (const reply of replies) {
    if (!reply.parent_reply_id) continue;

    // Walk up to the top-level ancestor so 3rd-level replies still render.
    let ancestorId: string | null = reply.parent_reply_id;
    const seen = new Set<string>();
    while (ancestorId && !rootById.has(ancestorId) && !seen.has(ancestorId)) {
      seen.add(ancestorId);
      ancestorId = byId.get(ancestorId)?.parent_reply_id ?? null;
    }

    const root = ancestorId ? rootById.get(ancestorId) : undefined;
    if (root) root.children.push(reply);
  }

  return roots;
}

/**
 * The current user's votes on one thread and its replies, keyed by target id
 * so the UI can highlight what they already voted on.
 */
export async function getUserVotes(
  userId: string,
  threadId: string,
  replyIds: string[],
): Promise<Record<string, "up" | "down">> {
  const supabase = await createClient();

  const filters = [`thread_id.eq.${threadId}`];
  if (replyIds.length > 0) filters.push(`reply_id.in.(${replyIds.join(",")})`);

  const { data } = await supabase
    .from("forum_votes")
    .select("thread_id, reply_id, vote")
    .eq("user_id", userId)
    .or(filters.join(","));

  const votes: Record<string, "up" | "down"> = {};
  for (const row of data ?? []) {
    const key = (row.thread_id ?? row.reply_id) as string | null;
    if (key) votes[key] = row.vote as "up" | "down";
  }
  return votes;
}
