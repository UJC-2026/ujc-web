import { createClient } from "@/lib/supabase/server";

export type Partner = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  sort_order: number;
};

export async function getPartners(): Promise<Partner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partners")
    .select("id, name, logo_url, website_url, description, sort_order")
    .order("sort_order")
    .order("name");

  return (data ?? []) as Partner[];
}

/** One homepage setting, or null when it has never been filled in. */
export async function getSiteSetting(key: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  const value = (data?.value as string | undefined)?.trim();
  return value ? value : null;
}

/**
 * The YouTube video id inside a watch, youtu.be, shorts, or embed URL.
 *
 * Parsed rather than embedded whole so the iframe src is something this code
 * built, not something a pengurus pasted — the value goes straight into a
 * frame, and "whatever was in the settings table" is not a good src.
 */
export function youtubeId(url: string | null): string | null {
  if (!url) return null;

  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{6,20})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,20})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,20})/,
    /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{6,20})/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match) return match[1];
  }

  return null;
}
