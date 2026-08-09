import type { PostgrestError } from "@supabase/supabase-js";

/**
 * SQLSTATE raised by the `enforce_rate_limit` trigger (migration 0032).
 * `program_limit_exceeded` — the caller is going too fast, nothing is broken.
 */
const RATE_LIMITED = "54000";

/**
 * The database's own wording when an action was throttled, otherwise the
 * caller's fallback.
 *
 * Postgres error text is never shown to a member as a rule — it leaks schema
 * and reads like a crash. The rate limit is the exception: that message was
 * written for the person reading it, quotes the actual ceiling, and says when
 * to come back. Swallowing it would leave "coba lagi sebentar lagi" on a
 * screen where trying again immediately is exactly what will not work.
 */
export function actionError(
  error: Pick<PostgrestError, "code" | "message"> | null,
  fallback: string,
) {
  return error?.code === RATE_LIMITED ? error.message : fallback;
}
