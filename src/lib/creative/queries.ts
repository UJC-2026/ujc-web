import { createClient } from "@/lib/supabase/server";

export type CreativeWork = {
  id: string;
  submitted_by: string;
  title: string;
  description: string | null;
  url: string;
  platform: "youtube" | "instagram" | "tiktok" | "facebook" | "lainnya";
  youtube_id: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  author: { id: string; full_name: string; avatar_url: string | null } | null;
};

const AUTHOR =
  "author:profiles!creative_works_submitted_by_fkey(id, full_name, avatar_url)";

/**
 * RLS returns approved works plus the caller's own pending ones and, for
 * moderators, the review queue — the page splits them, it never re-filters.
 */
export async function getCreativeWorks(): Promise<CreativeWork[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creative_works")
    .select(`*, ${AUTHOR}`)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  return (data ?? []).map((row) => {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    return { ...(row as unknown as CreativeWork), author: author ?? null };
  });
}
