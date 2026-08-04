import { createClient } from "@/lib/supabase/server";

export type Mentor = {
  id: string;
  user_id: string;
  expertise: string[];
  city: string | null;
  experience_summary: string | null;
  is_available: boolean;
  capacity: number;
  active_mentees: number;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    prefecture: string | null;
    angkatan: string | null;
  } | null;
  /** Derived here so render stays pure and the rule lives in one place. */
  isFull: boolean;
};

const PROFILE_FIELDS =
  "profile:profiles!mentors_user_id_fkey(id, full_name, avatar_url, prefecture, angkatan)";

function normalize(row: Record<string, unknown>): Mentor {
  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
  const capacity = row.capacity as number;
  const active = row.active_mentees as number;

  return {
    ...(row as unknown as Mentor),
    expertise: Array.isArray(row.expertise) ? (row.expertise as string[]) : [],
    profile: (profile as Mentor["profile"]) ?? null,
    isFull: active >= capacity,
  };
}

export async function getMentors(expertise?: string): Promise<Mentor[]> {
  const supabase = await createClient();

  let query = supabase
    .from("mentors")
    .select(`*, ${PROFILE_FIELDS}`)
    .order("created_at", { ascending: false });

  if (expertise) query = query.contains("expertise", [expertise]);

  const { data } = await query;
  return (data ?? []).map((row) => normalize(row as Record<string, unknown>));
}

export async function getMentor(id: string): Promise<Mentor | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentors")
    .select(`*, ${PROFILE_FIELDS}`)
    .eq("id", id)
    .maybeSingle();

  return data ? normalize(data as Record<string, unknown>) : null;
}

/** The mentor profile belonging to this member, if they registered as one. */
export async function getMyMentorProfile(
  userId: string,
): Promise<Mentor | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentors")
    .select(`*, ${PROFILE_FIELDS}`)
    .eq("user_id", userId)
    .maybeSingle();

  return data ? normalize(data as Record<string, unknown>) : null;
}

export type RequestStatus = "menunggu" | "diterima" | "ditolak" | "selesai";

export type MentorshipRequest = {
  id: string;
  mentor_id: string;
  mentee_id: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  mentee: { id: string; full_name: string; avatar_url: string | null } | null;
  mentor: { id: string; user_id: string } | null;
};

const REQUEST_FIELDS = `
  id, mentor_id, mentee_id, message, status, created_at,
  mentee:profiles!mentorship_requests_mentee_id_fkey(id, full_name, avatar_url),
  mentor:mentors!mentorship_requests_mentor_id_fkey(id, user_id)
`;

function normalizeRequest(row: Record<string, unknown>): MentorshipRequest {
  const mentee = Array.isArray(row.mentee) ? row.mentee[0] : row.mentee;
  const mentor = Array.isArray(row.mentor) ? row.mentor[0] : row.mentor;
  return {
    ...(row as unknown as MentorshipRequest),
    mentee: (mentee as MentorshipRequest["mentee"]) ?? null,
    mentor: (mentor as MentorshipRequest["mentor"]) ?? null,
  };
}

/**
 * RLS already narrows this to requests the caller is part of (or divisi
 * pendidikan overseeing the programme), so no extra filter is needed.
 */
export async function getMyRequests(): Promise<MentorshipRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentorship_requests")
    .select(REQUEST_FIELDS)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) =>
    normalizeRequest(row as Record<string, unknown>),
  );
}

/** Expertise tags present across mentors, for the filter chips. */
export async function getExpertiseTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("mentors").select("expertise");

  const tags = new Set<string>();
  for (const row of data ?? []) {
    for (const tag of (row.expertise as string[] | null) ?? []) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b, "id"));
}
