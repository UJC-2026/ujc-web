import { createClient } from "@/lib/supabase/server";

export type Job = {
  id: string;
  title: string;
  company: string;
  location_prefecture: string | null;
  salary_min: number | null;
  salary_max: number | null;
  contract_type: string | null;
  visa_types: string[];
  deadline: string | null;
  description: string | null;
  requirements: string | null;
  posted_by: string | null;
  is_verified: boolean;
  created_at: string;
  poster: { full_name: string } | null;
  /** Decided in the query; render must stay pure. */
  isExpired: boolean;
};

const POSTER = "poster:profiles!jobs_posted_by_fkey(full_name)";

function normalize(row: Record<string, unknown>): Job {
  const poster = Array.isArray(row.poster) ? row.poster[0] : row.poster;
  const deadline = row.deadline as string | null;

  return {
    ...(row as unknown as Job),
    visa_types: Array.isArray(row.visa_types) ? (row.visa_types as string[]) : [],
    poster: (poster as { full_name: string }) ?? null,
    isExpired: deadline !== null && new Date(deadline).getTime() < Date.now(),
  };
}

export async function getJobs({
  prefecture,
  visa,
}: { prefecture?: string; visa?: string } = {}): Promise<Job[]> {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(`*, ${POSTER}`)
    .order("created_at", { ascending: false });

  if (prefecture) query = query.eq("location_prefecture", prefecture);
  // visa_types is a jsonb array; `cs` is "contains".
  if (visa) query = query.contains("visa_types", [visa]);

  const { data } = await query;
  return (data ?? []).map((row) => normalize(row as Record<string, unknown>));
}

export async function getJob(id: string): Promise<Job | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select(`*, ${POSTER}`)
    .eq("id", id)
    .maybeSingle();

  return data ? normalize(data as Record<string, unknown>) : null;
}

export type SaveStatus = "disimpan" | "dilamar";

/** The signed-in member's saved/applied markers, keyed by job id. */
export async function getJobSaves(
  userId: string,
): Promise<Record<string, SaveStatus>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_saves")
    .select("job_id, status")
    .eq("user_id", userId);

  const map: Record<string, SaveStatus> = {};
  for (const row of data ?? []) {
    map[row.job_id as string] = row.status as SaveStatus;
  }
  return map;
}

/** Distinct prefectures and visa types present, for the filter chips. */
export async function getJobFilters(): Promise<{
  prefectures: string[];
  visaTypes: string[];
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("location_prefecture, visa_types");

  const prefectures = new Set<string>();
  const visaTypes = new Set<string>();

  for (const row of data ?? []) {
    if (row.location_prefecture) {
      prefectures.add(row.location_prefecture as string);
    }
    for (const visa of (row.visa_types as string[] | null) ?? []) {
      visaTypes.add(visa);
    }
  }

  return {
    prefectures: [...prefectures].sort((a, b) => a.localeCompare(b, "id")),
    visaTypes: [...visaTypes].sort((a, b) => a.localeCompare(b, "id")),
  };
}
