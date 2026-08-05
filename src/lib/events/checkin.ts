import { createClient } from "@/lib/supabase/server";

export type Attendee = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  method: "qr" | "kode";
  checked_in_at: string;
  certificate_number: string | null;
};

export type MyCertificate = {
  certificate_number: string;
  issued_at: string;
  event: {
    id: string;
    title: string;
    event_date: string;
    location: string | null;
    is_online: boolean;
  } | null;
};

/**
 * The caller's own attendance for one event, if it was recorded.
 *
 * The `user_id` filter is load-bearing and must not be dropped as "RLS already
 * does that". Both policies here read `user_id = auth.uid() or is_pengurus()`,
 * so for a pengurus an unfiltered query happily returns somebody else's row —
 * which is how this first shipped, and it told every pengurus they had
 * attended, over another member's certificate number.
 */
export async function getMyCheckin(
  eventId: string,
  userId: string,
): Promise<{ checked_in_at: string; certificate_number: string | null } | null> {
  const supabase = await createClient();

  const [{ data: checkin }, { data: certificate }] = await Promise.all([
    supabase
      .from("event_checkins")
      .select("checked_in_at")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("certificates")
      .select("certificate_number")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!checkin) return null;

  return {
    checked_in_at: checkin.checked_in_at as string,
    certificate_number:
      (certificate?.certificate_number as string | undefined) ?? null,
  };
}

/**
 * The attendance code for an event. RLS on `event_checkin_codes` hands this
 * back to divisi acara and admin only, so an ordinary member calling this gets
 * null rather than the code — the check is the database's, not this function's.
 */
export async function getCheckinCode(eventId: string): Promise<{
  code: string;
  opens_at: string | null;
  closes_at: string | null;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_checkin_codes")
    .select("code, opens_at, closes_at")
    .eq("event_id", eventId)
    .maybeSingle();

  return data
    ? {
        code: data.code as string,
        opens_at: data.opens_at as string | null,
        closes_at: data.closes_at as string | null,
      }
    : null;
}

/**
 * Whether attendance is open right now. Members cannot read the code table, so
 * this boolean is the only thing that crosses to them — enough to decide
 * whether to offer the form, without revealing the code.
 */
export async function isCheckinOpen(eventId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("event_checkin_open", {
    p_event_id: eventId,
  });
  return data === true;
}

/** Pengurus-only roll for one event; the RPC refuses anyone else. */
export async function getAttendees(eventId: string): Promise<Attendee[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("event_attendees", {
    p_event_id: eventId,
  });

  return (data as Attendee[] | null) ?? [];
}

/** Every certificate the caller holds. Filtered here, not left to RLS — see getMyCheckin. */
export async function getMyCertificates(
  userId: string,
): Promise<MyCertificate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select(
      "certificate_number, issued_at, event:events(id, title, event_date, location, is_online)",
    )
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  return (data ?? []).map((row) => {
    const event = Array.isArray(row.event) ? row.event[0] : row.event;
    return {
      certificate_number: row.certificate_number as string,
      issued_at: row.issued_at as string,
      event: (event as MyCertificate["event"]) ?? null,
    };
  });
}

/**
 * One certificate, with everything the printable page needs to name it.
 *
 * Scoped to `userId` on purpose: the select policy also lets pengurus read
 * everyone's, so without this the sheet would print a colleague's name for any
 * pengurus who opened their own certificate link.
 */
export async function getCertificate(
  eventId: string,
  userId: string,
): Promise<(MyCertificate & { holder: string }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select(
      "certificate_number, issued_at, holder:profiles!certificates_user_id_fkey(full_name), event:events(id, title, event_date, location, is_online)",
    )
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const event = Array.isArray(data.event) ? data.event[0] : data.event;
  const holder = Array.isArray(data.holder) ? data.holder[0] : data.holder;

  return {
    certificate_number: data.certificate_number as string,
    issued_at: data.issued_at as string,
    event: (event as MyCertificate["event"]) ?? null,
    holder: (holder as { full_name: string } | null)?.full_name ?? "Anggota UJC",
  };
}
