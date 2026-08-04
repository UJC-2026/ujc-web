import { createClient } from "@/lib/supabase/server";

export type Resource = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  file_url: string | null;
  link: string | null;
  created_at: string;
};

const UNCATEGORIZED = "Lainnya";

export async function getResources(category?: string): Promise<Resource[]> {
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select("id, title, category, description, file_url, link, created_at")
    .order("created_at", { ascending: false });

  if (category && category !== UNCATEGORIZED) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return (data as Resource[] | null) ?? [];
}

/** Distinct categories present in the table, for the filter chips. */
export async function getResourceCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("category");

  const categories = new Set<string>();
  for (const row of data ?? []) {
    if (row.category) categories.add(row.category as string);
  }

  return Array.from(categories).sort((a, b) => a.localeCompare(b, "id"));
}
