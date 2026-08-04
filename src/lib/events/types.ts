export type RsvpStatus = "hadir" | "mungkin" | "tidak";

export type EventOrganizer = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export type UjcEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  prefecture: string | null;
  event_date: string;
  is_online: boolean;
  meeting_link: string | null;
  cover_url: string | null;
  capacity: number | null;
  created_by: string | null;
  created_at: string;
  organizer: EventOrganizer | null;
  /** Attendees who answered "hadir"; filled in by the list/detail queries. */
  going_count: number;
};

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  hadir: "Hadir",
  mungkin: "Mungkin",
  tidak: "Tidak bisa",
};

export function isUpcoming(event: Pick<UjcEvent, "event_date">) {
  return new Date(event.event_date).getTime() >= Date.now();
}

/** True once the event has as many "hadir" RSVPs as it has seats. */
export function isFull(event: Pick<UjcEvent, "capacity" | "going_count">) {
  return event.capacity !== null && event.going_count >= event.capacity;
}
