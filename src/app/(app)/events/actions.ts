"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const rsvpSchema = z.object({
  eventId: z.uuid(),
  status: z.enum(["hadir", "mungkin", "tidak"]),
});

export type RsvpState = { error?: string; success?: string };

export async function setRsvp(
  _prev: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  const parsed = rsvpSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: "Pilihan RSVP tidak dikenali." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/events/${parsed.data.eventId}`);

  const { data: event } = await supabase
    .from("events")
    .select("id, event_date, capacity, going_count")
    .eq("id", parsed.data.eventId)
    .maybeSingle();

  if (!event) return { error: "Event ini sudah tidak ada." };

  if (new Date(event.event_date).getTime() < Date.now()) {
    return { error: "Event ini sudah lewat, jadi RSVP sudah ditutup." };
  }

  const { data: existing } = await supabase
    .from("event_rsvp")
    .select("id, status")
    .eq("event_id", parsed.data.eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Only a *new* "hadir" consumes a seat — switching away from it frees one,
  // and re-confirming an existing "hadir" changes nothing.
  const takesSeat =
    parsed.data.status === "hadir" && existing?.status !== "hadir";

  // Reads the denormalized tally rather than counting event_rsvp rows: RLS
  // only exposes the caller's own RSVP, so a row count here would always be
  // 0 or 1 and the guard would never fire. See migration 0007.
  if (event.capacity !== null && takesSeat && event.going_count >= event.capacity) {
    return { error: "Kuota event ini sudah penuh." };
  }

  const { error } = await supabase
    .from("event_rsvp")
    .upsert(
      {
        event_id: parsed.data.eventId,
        user_id: user.id,
        status: parsed.data.status,
      },
      { onConflict: "event_id,user_id" },
    );

  if (error) return { error: "RSVP gagal disimpan. Coba lagi sebentar lagi." };

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath("/events");

  return { success: "RSVP kamu tersimpan." };
}
