import { createClient } from "@/lib/supabase/server";

/**
 * Says whether the app can actually reach its own database.
 *
 * Every page here degrades to an empty state when a query fails, which is the
 * right behaviour for one broken panel and the wrong signal for a broken
 * deployment: a site wired to the wrong Supabase project answered 200 on every
 * route and looked like a community that simply had no content yet. Nothing an
 * uptime check could see, and nothing a visitor could tell apart from "baru
 * mulai".
 *
 * This route is the one place that refuses to pretend. Point a monitor at it.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  // `profiles` is the table nothing works without: auth, membership, and
  // every authored row hang off it. If it is not reachable, neither is the app.
  //
  // A plain select, not `head: true`. A HEAD request comes back with no body,
  // and supabase-js leaves `error` null when there is nothing to parse — so
  // the first version of this check reported a healthy database while
  // PostgREST was answering 404 to every request.
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return Response.json(
      {
        ok: false,
        database: "unreachable",
        // PostgREST says exactly what is wrong — a missing table, a schema
        // mismatch, a refused connection. That sentence is the whole point.
        detail: error.message,
        code: error.code,
      },
      { status: 503 },
    );
  }

  return Response.json({ ok: true, database: "reachable" });
}
