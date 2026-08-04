import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export const MEMBERS_PER_PAGE = 24;

export type MemberCard = Pick<
  Profile,
  | "id"
  | "full_name"
  | "avatar_url"
  | "city"
  | "prefecture"
  | "angkatan"
  | "major"
  | "bio"
  | "role"
  | "is_verified"
  | "join_date"
> & {
  /** Present when this member has an active mentor profile. */
  isMentor: boolean;
};

export const MEMBER_SORTS = {
  terbaru: "Terbaru bergabung",
  abjad: "Abjad",
} as const;

export type MemberSort = keyof typeof MEMBER_SORTS;

export function isMemberSort(value: string | undefined): value is MemberSort {
  return value !== undefined && value in MEMBER_SORTS;
}

const CARD_FIELDS =
  "id, full_name, avatar_url, city, prefecture, angkatan, major, bio, role, is_verified, join_date";

/**
 * RLS already hides members who turned off `is_profile_public`, so this does
 * not filter on it — a hidden member simply never appears in the result.
 */
export async function getMembers({
  search,
  prefecture,
  angkatan,
  sort = "terbaru",
  page = 1,
}: {
  search?: string;
  prefecture?: string;
  angkatan?: string;
  sort?: MemberSort;
  page?: number;
}): Promise<{ members: MemberCard[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(CARD_FIELDS, { count: "exact" });

  if (search?.trim()) {
    const term = search.trim().replace(/[%,]/g, "");
    query = query.or(`full_name.ilike.%${term}%,nim.ilike.%${term}%`);
  }
  if (prefecture) query = query.eq("prefecture", prefecture);
  if (angkatan) query = query.eq("angkatan", angkatan);

  query =
    sort === "abjad"
      ? query.order("full_name", { ascending: true })
      : query.order("join_date", { ascending: false });

  const from = (page - 1) * MEMBERS_PER_PAGE;
  const { data, count } = await query.range(from, from + MEMBERS_PER_PAGE - 1);

  const rows = (data ?? []) as Omit<MemberCard, "isMentor">[];
  if (rows.length === 0) return { members: [], total: count ?? 0 };

  // One extra query marks the mentors instead of one per card.
  const { data: mentors } = await supabase
    .from("mentors")
    .select("user_id")
    .in(
      "user_id",
      rows.map((row) => row.id),
    )
    .eq("is_available", true);

  const mentorIds = new Set((mentors ?? []).map((row) => row.user_id as string));

  return {
    members: rows.map((row) => ({ ...row, isMentor: mentorIds.has(row.id) })),
    total: count ?? 0,
  };
}

/** Distinct prefectures and angkatan present, for the filter chips. */
export async function getMemberFilters(): Promise<{
  prefectures: string[];
  angkatans: string[];
}> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("prefecture, angkatan");

  const prefectures = new Set<string>();
  const angkatans = new Set<string>();

  for (const row of data ?? []) {
    if (row.prefecture) prefectures.add(row.prefecture as string);
    if (row.angkatan) angkatans.add(row.angkatan as string);
  }

  return {
    prefectures: [...prefectures].sort((a, b) => a.localeCompare(b, "id")),
    angkatans: [...angkatans].sort((a, b) => b.localeCompare(a, "id")),
  };
}

export type MemberStats = { total: number; prefectures: number };

export async function getMemberStats(): Promise<MemberStats> {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("profiles")
    .select("prefecture", { count: "exact" });

  const prefectures = new Set<string>();
  for (const row of data ?? []) {
    if (row.prefecture) prefectures.add(row.prefecture as string);
  }

  return { total: count ?? 0, prefectures: prefectures.size };
}

export type MemberProfile = Profile & {
  isMentor: boolean;
  mentorId: string | null;
  points: number;
  threadCount: number;
};

export async function getMemberProfile(
  id: string,
): Promise<MemberProfile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const [mentor, points, threads] = await Promise.all([
    supabase.from("mentors").select("id").eq("user_id", id).maybeSingle(),
    supabase.from("user_points").select("points").eq("user_id", id),
    supabase
      .from("forum_threads")
      .select("id", { count: "exact", head: true })
      .eq("author_id", id),
  ]);

  return {
    ...(data as Profile),
    isMentor: Boolean(mentor.data),
    mentorId: (mentor.data?.id as string) ?? null,
    points: (points.data ?? []).reduce(
      (sum, row) => sum + (row.points as number),
      0,
    ),
    threadCount: threads.count ?? 0,
  };
}

export type MemberThread = {
  id: string;
  title: string;
  created_at: string;
  href: string | null;
};

export async function getMemberThreads(id: string): Promise<MemberThread[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_threads")
    .select("id, title, created_at, category:forum_categories(slug)")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data ?? []).map((row) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    return {
      id: row.id as string,
      title: row.title as string,
      created_at: row.created_at as string,
      href: category ? `/forum/${category.slug}/${row.id}` : null,
    };
  });
}

export type MemberListing = {
  id: string;
  title: string;
  price: number | null;
  is_giveaway: boolean;
  status: string;
};

export async function getMemberListings(id: string): Promise<MemberListing[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_items")
    .select("id, title, price, is_giveaway, status")
    .eq("seller_id", id)
    .neq("status", "terjual")
    .order("created_at", { ascending: false })
    .limit(6);

  return (data as MemberListing[] | null) ?? [];
}

