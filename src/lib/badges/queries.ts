import { createClient } from "@/lib/supabase/server";

export type BadgeTier = "perunggu" | "perak" | "emas";

export type EarnedBadge = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  earned_at: string;
};

/**
 * The badges one member holds.
 *
 * RLS on `user_badges` already hides the rows of a member who has made their
 * profile private, so a hidden profile simply comes back empty rather than
 * needing a second check here.
 */
export async function getMemberBadges(userId: string): Promise<EarnedBadge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("earned_at, badge:badges(slug, name, description, icon, tier, sort_order)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  return (data ?? [])
    .map((row) => {
      const badge = Array.isArray(row.badge) ? row.badge[0] : row.badge;
      if (!badge) return null;
      return {
        slug: badge.slug as string,
        name: badge.name as string,
        description: badge.description as string,
        icon: badge.icon as string,
        tier: badge.tier as BadgeTier,
        earned_at: row.earned_at as string,
      };
    })
    .filter((badge): badge is EarnedBadge => badge !== null);
}

/** The whole catalogue, so a profile can show what is still unearned. */
export async function getBadgeCatalogue(): Promise<
  Omit<EarnedBadge, "earned_at">[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select("slug, name, description, icon, tier")
    .order("sort_order");

  return (data ?? []) as Omit<EarnedBadge, "earned_at">[];
}
