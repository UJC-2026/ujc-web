import type { UserRole } from "@/lib/supabase/types";

export type ForumCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
};

export type ThreadAuthor = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
};

export type ForumThread = {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  score: number;
  created_at: string;
  updated_at: string;
  author: ThreadAuthor | null;
};

export type ForumReply = {
  id: string;
  thread_id: string;
  author_id: string;
  parent_reply_id: string | null;
  content: string;
  score: number;
  created_at: string;
  author: ThreadAuthor | null;
};

/** A reply with its direct children attached (the forum nests two levels). */
export type ThreadedReply = ForumReply & { children: ForumReply[] };

export const THREAD_SORTS = {
  terbaru: "Terbaru",
  populer: "Terpopuler",
  belum_dijawab: "Belum dijawab",
} as const;

export type ThreadSort = keyof typeof THREAD_SORTS;

export function isThreadSort(value: string | undefined): value is ThreadSort {
  return value !== undefined && value in THREAD_SORTS;
}

export const THREADS_PER_PAGE = 15;
