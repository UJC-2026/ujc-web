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

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
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
