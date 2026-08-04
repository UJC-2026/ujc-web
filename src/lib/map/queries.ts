import { createClient } from "@/lib/supabase/server";

export type PrefectureCount = { prefecture: string; member_count: number };
export type CityCount = PrefectureCount & { city: string | null };

/**
 * Both of these come from aggregate RPCs. The underlying rows are private to
 * their owner, so there is no path from here to an individual's coordinates.
 */
export async function getPrefectureCounts(): Promise<PrefectureCount[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("member_map_prefectures");

  return (data ?? []).map((row: { prefecture: string; member_count: number }) => ({
    prefecture: row.prefecture,
    member_count: Number(row.member_count),
  }));
}

export async function getCityCounts(): Promise<CityCount[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("member_map_points");

  return (data ?? []).map(
    (row: { prefecture: string; city: string | null; member_count: number }) => ({
      prefecture: row.prefecture,
      city: row.city,
      member_count: Number(row.member_count),
    }),
  );
}
