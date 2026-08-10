/**
 * Wraps fetch so a failing database request is never silent.
 *
 * Almost every query in this codebase reads `data` and drops `error` — 89 of
 * them — then falls back to `?? []`. That is deliberate for resilience: one
 * broken panel should not take a page down. But it means a database that is
 * unreachable, or pointed at the wrong project, renders as "belum ada isi" on
 * every page and returns HTTP 200. A production deployment wired to the wrong
 * Supabase project looked completely healthy from the outside while not one
 * table existed.
 *
 * Logging here rather than at 89 call sites: the failure is visible in the
 * server log with the table and PostgREST's own message, and no page changes
 * behaviour. It is the difference between "no articles yet" and a log line
 * saying `Could not find the table 'public.blog_posts'`.
 */
export function loggingFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, init).then((response) => {
    if (response.ok) return response;

    const url = typeof input === "string" ? input : input.toString();

    // Auth failures are ordinary traffic — a wrong password is not a fault,
    // and its response is not something to write to a log.
    if (!url.includes("/rest/v1/") && !url.includes("/storage/v1/")) {
      return response;
    }

    // Read from a clone so the caller still gets an unconsumed body.
    response
      .clone()
      .text()
      .then((body) => {
        console.error(
          `[supabase] ${init?.method ?? "GET"} ${response.status} ${stripQuery(url)} — ${body.slice(0, 300)}`,
        );
      })
      .catch(() => {
        console.error(`[supabase] ${response.status} ${stripQuery(url)}`);
      });

    return response;
  });
}

/** Query strings carry filter values, which can be member data. */
function stripQuery(url: string) {
  const cut = url.indexOf("?");
  return cut === -1 ? url : url.slice(0, cut);
}
