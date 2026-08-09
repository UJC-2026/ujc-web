import { createClient } from "@/lib/supabase/server";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

/** RLS already scopes every row to the signed-in member. */
export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data as Notification[] | null) ?? [];
}

/**
 * Raises this weekend's academic reminder if it is due and not yet claimed.
 *
 * Called from the bell rather than from the dashboard because this is the one
 * place every signed-in member passes on every page, so the badge is already
 * counting it the moment they arrive. On weekdays the function returns after a
 * single comparison without touching a table.
 *
 * Failure here must never take a page down: the cost is a reminder that waits
 * for the next visit.
 */
async function claimAcademicReminder(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const { error } = await supabase.rpc("claim_academic_reminder");
  if (error) {
    console.error("claim_academic_reminder failed", error.message);
  }
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();

  await claimAcademicReminder(supabase);

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  return count ?? 0;
}

/** Every type the app can raise, with a label for the preferences page. */
export const NOTIFICATION_TYPES = {
  forum_reply: "Balasan di forum",
  pesan_baru: "Pesan langsung",
  tugas_baru: "Tugas baru untukmu",
  mentorship_request: "Permintaan bimbingan masuk",
  mentorship_answer: "Jawaban atas permintaan bimbinganmu",
  papan_balasan: "Balasan di papan internal",
  sertifikat_terbit: "E-sertifikat kehadiran terbit",
  lelang_menang: "Kamu memenangkan lelang",
  lelang_selesai: "Lelang yang kamu buka ditutup",
  lencana_baru: "Lencana baru terkumpul",
  reminder_akademik: "Reminder akademik akhir pekan",
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export async function getPreferences(): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("type, channel_inapp");

  // Absent row means "on" — the trigger treats it the same way.
  const prefs: Record<string, boolean> = {};
  for (const type of Object.keys(NOTIFICATION_TYPES)) prefs[type] = true;
  for (const row of data ?? []) {
    prefs[row.type as string] = row.channel_inapp as boolean;
  }
  return prefs;
}
