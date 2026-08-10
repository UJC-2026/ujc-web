import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Divisi, Profile } from "@/lib/supabase/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The signed-in user and their profile row, read once.
 *
 * Reports three outcomes rather than two, because "not signed in", "signed in
 * but the profile could not be read", and "signed in with no profile row" call
 * for different answers and used to collapse into a single `null`.
 *
 * `maybeSingle` rather than `single`: `single` treats an absent row as an
 * error, which is exactly the distinction being drawn here.
 */
async function loadSession(): Promise<{
  user: { id: string } | null;
  profile: Profile | null;
  /** The query itself failed — an outage, not an absent member. */
  unreadable: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, unreadable: false };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: (data as Profile | null) ?? null,
    unreadable: Boolean(error),
  };
}

/**
 * Deliberately forgiving: this is what the site header reads on every page,
 * including the ones anybody can browse. Making it throw turned a database
 * outage into a 500 on the homepage for every signed-in member, which is a
 * worse day than a header that renders logged-out.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  return (await loadSession()).profile;
}

/**
 * The profile for a page that cannot work without one.
 *
 * Strict where `getCurrentProfile` is forgiving, and the strictness is the
 * point: this used to send anyone whose profile came back empty to /login,
 * whatever the reason. The proxy bounces an authenticated visitor off /login
 * straight back to /dashboard, which lands here again — so a member who
 * signed in perfectly well ping-ponged until the browser gave up on a blank
 * page with nothing to click. It looked like the login button was broken.
 * The database being unreachable was the actual cause.
 */
export async function requireProfile(): Promise<Profile> {
  const { user, profile, unreadable } = await loadSession();

  // Genuinely signed out. The proxy has usually redirected already, and
  // /login renders normally for someone with no session, so this cannot loop.
  if (!user) redirect("/login");

  // Signed in, but the profile could not be read. An outage — say so and
  // stop. Logging in again would not help, and pretending they are signed out
  // is what caused the loop.
  if (unreadable) {
    throw new Error(
      "Data profil tidak bisa dibaca dari database. Ini gangguan di sisi server, bukan sesi kamu.",
    );
  }

  // Signed in, database fine, no row. The account is broken in a way the
  // member cannot fix by trying again.
  if (!profile) {
    throw new Error(
      "Akunmu tidak punya data profil. Hubungi pengurus — ini perlu diperbaiki dari sisi admin.",
    );
  }

  return profile;
}

export async function getPengurusRoles(userId: string): Promise<Divisi[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pengurus")
    .select("divisi, org_periods!inner(is_active)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("org_periods.is_active", true);

  return (data ?? []).map((row) => row.divisi as Divisi);
}
