import { createClient } from "@/lib/supabase/server";

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  description: string | null;
  contact: string | null;
  city: string | null;
  images: string[];
  is_verified: boolean;
  created_at: string;
  owner: { id: string; full_name: string; avatar_url: string | null } | null;
};

const OWNER = "owner:profiles!businesses_owner_id_fkey(id, full_name, avatar_url)";

/**
 * RLS returns verified listings plus the caller's own and, for moderators,
 * everything awaiting review — so no status filter belongs here.
 */
export async function getBusinesses(category?: string): Promise<Business[]> {
  const supabase = await createClient();

  let query = supabase
    .from("businesses")
    .select(`*, ${OWNER}`)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data } = await query;
  return (data ?? []).map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return {
      ...(row as unknown as Business),
      images: Array.isArray(row.images) ? (row.images as string[]) : [],
      owner: (owner as Business["owner"]) ?? null,
    };
  });
}

export async function getBusinessCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("category")
    .eq("is_verified", true);

  const set = new Set<string>();
  for (const row of data ?? []) if (row.category) set.add(row.category as string);
  return [...set].sort((a, b) => a.localeCompare(b, "id"));
}

export type Workshop = {
  id: string;
  title: string;
  description: string | null;
  type: "workshop" | "seminar" | "webinar";
  speaker: string | null;
  scheduled_at: string;
  meeting_link: string | null;
  recording_url: string | null;
  material_url: string | null;
  capacity: number | null;
  registered_count: number;
  /** Decided here so render stays pure. */
  isPast: boolean;
  isFull: boolean;
};

export async function getWorkshops(): Promise<Workshop[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workshops")
    .select("*")
    .order("scheduled_at", { ascending: false });

  const now = Date.now();
  return (data ?? []).map((row) => {
    const w = row as unknown as Workshop;
    return {
      ...w,
      isPast: new Date(w.scheduled_at).getTime() < now,
      isFull: w.capacity !== null && w.registered_count >= w.capacity,
    };
  });
}

/** Workshop ids the signed-in member has registered for. */
export async function getMyRegistrations(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workshop_registrations")
    .select("workshop_id")
    .eq("user_id", userId);

  return new Set((data ?? []).map((row) => row.workshop_id as string));
}
