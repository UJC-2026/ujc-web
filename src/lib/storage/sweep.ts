import type { createClient } from "@/lib/supabase/server";

type Orphan = { bucket: string; path: string };

/**
 * Deletes the caller's own images that no row points at any more.
 *
 * Postgres notices the dereference (migration 0035) but cannot reach the
 * Storage API, so the deletion happens here. Called at the end of the actions
 * that replace an image rather than on every page: that is the moment an
 * orphan appears, and it keeps the work off the hot path of ordinary reads.
 *
 * Never throws. A failure means an old file lingers until the member's next
 * save — the queue row is left in place precisely so it gets another attempt.
 * Losing a photo would matter; deleting it slightly later does not.
 */
export async function sweepStorageOrphans(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const { data, error } = await supabase.rpc("storage_orphans_ready");

  if (error) {
    console.error("storage_orphans_ready failed", error.message);
    return;
  }

  const orphans = (data ?? []) as Orphan[];
  if (orphans.length === 0) return;

  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of orphans) {
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), path]);
  }

  for (const [bucket, paths] of byBucket) {
    const { error: removeError } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (removeError) {
      console.error(`storage sweep failed for ${bucket}`, removeError.message);
      continue;
    }

    // Only forget the queue entry once the object is really gone, so a failed
    // delete is retried instead of being quietly dropped.
    await supabase.rpc("storage_orphans_clear", {
      p_bucket: bucket,
      p_paths: paths,
    });
  }
}
