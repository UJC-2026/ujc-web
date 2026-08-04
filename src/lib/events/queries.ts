import { createClient } from "@/lib/supabase/server";
import type { RsvpStatus, UjcEvent } from "./types";

const ORGANIZER_FIELDS =
  "organizer:profiles!events_created_by_fkey(id, full_name, avatar_url)";

// going_count is a column on events maintained by a trigger. Counting
// event_rsvp rows here would return 0 for ordinary visitors, since RLS only
// exposes a member's own RSVP. See migration 0007.
const EVENT_FIELDS = `*, ${ORGANIZER_FIELDS}`;

export async function getEvents({
  scope = "upcoming",
  limit,
}: {
  scope?: "upcoming" | "past";
  limit?: number;
} = {}): Promise<UjcEvent[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase.from("events").select(EVENT_FIELDS);

  if (scope === "upcoming") {
    query = query.gte("event_date", now).order("event_date", { ascending: true });
  } else {
    query = query.lt("event_date", now).order("event_date", { ascending: false });
  }

  if (limit) query = query.limit(limit);

  const { data } = await query;
  return (data as UjcEvent[] | null) ?? [];
}

export async function getEventById(id: string): Promise<UjcEvent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  return (data as UjcEvent | null) ?? null;
}

/** The signed-in user's RSVP for one event, if they have answered. */
export async function getUserRsvp(
  userId: string,
  eventId: string,
): Promise<RsvpStatus | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_rsvp")
    .select("status")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  return (data?.status as RsvpStatus | undefined) ?? null;
}
