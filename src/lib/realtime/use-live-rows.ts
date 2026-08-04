"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Refreshes the current route when rows matching `filter` change.
 *
 * Rather than merging payloads into local state, this asks the server to
 * re-render. The row arriving over the wire has already passed RLS, but the
 * rendered page also needs joins and derived values the payload does not
 * carry — re-fetching keeps one source of truth instead of a second, subtly
 * different code path for "live" rows.
 *
 * `setAuth` is essential: without the user's access token Realtime has no
 * identity to evaluate the table's RLS against, and silently delivers nothing.
 */
export function useLiveRows({
  table,
  filter,
  event = "INSERT",
}: {
  table: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

      channel = supabase
        .channel(`live:${table}:${filter ?? "all"}`)
        .on(
          "postgres_changes",
          { event, schema: "public", table, ...(filter ? { filter } : {}) },
          () => router.refresh(),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [table, filter, event, router]);
}
