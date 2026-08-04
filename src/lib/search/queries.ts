import { createClient } from "@/lib/supabase/server";
import type { SearchHit } from "./types";

export type { SearchHit, SearchKind } from "./types";
export { KIND_LABEL } from "./types";

/**
 * The RPC runs as the caller, so results are already filtered to what this
 * visitor is allowed to see — no extra filtering belongs here.
 */
export async function search(q: string, perKind = 5): Promise<SearchHit[]> {
  if (!q.trim()) return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc("global_search", {
    q,
    per_kind: perKind,
  });

  return ((data ?? []) as SearchHit[]).sort((a, b) => b.rank - a.rank);
}
