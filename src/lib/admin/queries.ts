import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import type { Profile, UserRole } from "@/lib/supabase/types";

/**
 * PostgREST returns a to-one embed as an object, but the generated types widen
 * it to an array because the relationship cannot always be proven at the type
 * level. This normalizes either shape so the call sites stay honest instead of
 * casting the difference away.
 */
function toOne<T>(embed: unknown): T | null {
  if (embed == null) return null;
  if (Array.isArray(embed)) return (embed[0] as T | undefined) ?? null;
  return embed as T;
}

/**
 * Gate for every /admin route. RLS is the real enforcement — this only decides
 * whether the UI is worth rendering, and sends everyone else somewhere useful.
 */
export async function requireModerator(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "admin" && profile.role !== "moderator") {
    redirect("/dashboard");
  }
  return profile;
}

export type AdminStats = {
  members: number;
  verifiedMembers: number;
  threads: number;
  replies: number;
  events: number;
  upcomingEvents: number;
  pendingReports: number;
  newFlags: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const head = { count: "exact" as const, head: true };

  const [
    members,
    verified,
    threads,
    replies,
    events,
    upcoming,
    reports,
    flags,
  ] = await Promise.all([
    supabase.from("profiles").select("id", head),
    supabase.from("profiles").select("id", head).eq("is_verified", true),
    supabase.from("forum_threads").select("id", head),
    supabase.from("forum_replies").select("id", head),
    supabase.from("events").select("id", head),
    supabase.from("events").select("id", head).gte("event_date", now),
    supabase.from("reports").select("id", head).eq("status", "menunggu"),
    supabase.from("content_flags").select("id", head).eq("status", "baru"),
  ]);

  return {
    members: members.count ?? 0,
    verifiedMembers: verified.count ?? 0,
    threads: threads.count ?? 0,
    replies: replies.count ?? 0,
    events: events.count ?? 0,
    upcomingEvents: upcoming.count ?? 0,
    pendingReports: reports.count ?? 0,
    newFlags: flags.count ?? 0,
  };
}

/** Member counts per prefecture, biggest first — for the distribution panel. */
export async function getPrefectureBreakdown(): Promise<
  { prefecture: string; count: number }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("prefecture")
    .not("prefecture", "is", null);

  const tally = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.prefecture as string;
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }

  return Array.from(tally, ([prefecture, count]) => ({ prefecture, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export type QueueItem = {
  kind: "report" | "flag";
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  createdAt: string;
  reporterName: string | null;
  isAutomatic: boolean;
};

/**
 * Reports (raised by members) and automatic keyword flags land in one queue so
 * moderators have a single place to work through.
 */
export async function getModerationQueue(): Promise<QueueItem[]> {
  const supabase = await createClient();

  const [reports, flags] = await Promise.all([
    supabase
      .from("reports")
      .select(
        "id, content_type, content_id, reason, created_at, reporter:profiles!reports_reporter_id_fkey(full_name)",
      )
      .eq("status", "menunggu")
      .order("created_at", { ascending: false }),
    supabase
      .from("content_flags")
      .select("id, content_type, content_id, reason, created_at, is_automatic")
      .eq("status", "baru")
      .order("created_at", { ascending: false }),
  ]);

  const items: QueueItem[] = [];

  for (const row of reports.data ?? []) {
    const reporter = toOne<{ full_name: string }>(row.reporter);
    items.push({
      kind: "report",
      id: row.id as string,
      contentType: row.content_type as string,
      contentId: row.content_id as string,
      reason: row.reason as string,
      createdAt: row.created_at as string,
      reporterName: reporter?.full_name ?? null,
      isAutomatic: false,
    });
  }

  for (const row of flags.data ?? []) {
    items.push({
      kind: "flag",
      id: row.id as string,
      contentType: row.content_type as string,
      contentId: row.content_id as string,
      reason: row.reason as string,
      createdAt: row.created_at as string,
      reporterName: null,
      isAutomatic: row.is_automatic as boolean,
    });
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type PendingSubmission = {
  kind: "lowongan" | "artikel" | "bisnis" | "karya";
  id: string;
  title: string;
  submitter: string | null;
  createdAt: string;
  href: string;
};

/**
 * Everything sitting behind a review gate, in one list. Each of these gates is
 * enforced by a database trigger; this query only surfaces the backlog so
 * moderators do not have to visit four pages to find it.
 */
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const supabase = await createClient();

  const [jobs, posts, businesses, works] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, created_at, poster:profiles!jobs_posted_by_fkey(full_name)")
      .eq("is_verified", false),
    supabase
      .from("blog_posts")
      .select("id, title, slug, created_at, author:profiles!blog_posts_author_id_fkey(full_name)")
      .eq("status", "ditinjau"),
    supabase
      .from("businesses")
      .select("id, name, created_at, owner:profiles!businesses_owner_id_fkey(full_name)")
      .eq("is_verified", false),
    supabase
      .from("creative_works")
      .select("id, title, created_at, author:profiles!creative_works_submitted_by_fkey(full_name)")
      .eq("is_approved", false),
  ]);

  const items: PendingSubmission[] = [];

  for (const row of jobs.data ?? []) {
    items.push({
      kind: "lowongan", id: row.id as string, title: row.title as string,
      submitter: toOne<{ full_name: string }>(row.poster)?.full_name ?? null,
      createdAt: row.created_at as string, href: `/jobs/${row.id}`,
    });
  }
  for (const row of posts.data ?? []) {
    items.push({
      kind: "artikel", id: row.id as string, title: row.title as string,
      submitter: toOne<{ full_name: string }>(row.author)?.full_name ?? null,
      createdAt: row.created_at as string, href: `/blog/${row.slug}`,
    });
  }
  for (const row of businesses.data ?? []) {
    items.push({
      kind: "bisnis", id: row.id as string, title: row.name as string,
      submitter: toOne<{ full_name: string }>(row.owner)?.full_name ?? null,
      createdAt: row.created_at as string, href: "/business",
    });
  }
  for (const row of works.data ?? []) {
    items.push({
      kind: "karya", id: row.id as string, title: row.title as string,
      submitter: toOne<{ full_name: string }>(row.author)?.full_name ?? null,
      createdAt: row.created_at as string, href: "/creative-hub",
    });
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Resolves queue entries to a title and link so moderators see the context. */
export async function getQueueTargets(
  items: QueueItem[],
): Promise<Record<string, { title: string; href: string | null }>> {
  const supabase = await createClient();

  const threadIds = items
    .filter((i) => i.contentType === "thread")
    .map((i) => i.contentId);
  const replyIds = items
    .filter((i) => i.contentType === "reply")
    .map((i) => i.contentId);

  const targets: Record<string, { title: string; href: string | null }> = {};

  if (threadIds.length > 0) {
    const { data } = await supabase
      .from("forum_threads")
      .select("id, title, category:forum_categories(slug)")
      .in("id", threadIds);

    for (const row of data ?? []) {
      const category = toOne<{ slug: string }>(row.category);
      targets[row.id as string] = {
        title: row.title as string,
        href: category ? `/forum/${category.slug}/${row.id}` : null,
      };
    }
  }

  if (replyIds.length > 0) {
    const { data } = await supabase
      .from("forum_replies")
      .select("id, content, thread:forum_threads(id, title, category:forum_categories(slug))")
      .in("id", replyIds);

    for (const row of data ?? []) {
      const thread = toOne<{
        id: string;
        title: string;
        category: unknown;
      }>(row.thread);
      const category = toOne<{ slug: string }>(thread?.category);

      targets[row.id as string] = {
        title: thread ? `Balasan di "${thread.title}"` : "Balasan",
        href: thread && category
          ? `/forum/${category.slug}/${thread.id}`
          : null,
      };
    }
  }

  const itemIds = items
    .filter((i) => i.contentType === "barang")
    .map((i) => i.contentId);

  if (itemIds.length > 0) {
    const { data } = await supabase
      .from("marketplace_items")
      .select("id, title")
      .in("id", itemIds);

    for (const row of data ?? []) {
      targets[row.id as string] = {
        title: row.title as string,
        href: `/marketplace/${row.id}`,
      };
    }
  }

  return targets;
}

export type AdminMember = Pick<
  Profile,
  "id" | "full_name" | "role" | "is_verified" | "city" | "prefecture" | "angkatan" | "avatar_url" | "join_date"
>;

export async function getMembers(search?: string): Promise<AdminMember[]> {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, role, is_verified, city, prefecture, angkatan, avatar_url, join_date",
    )
    .order("join_date", { ascending: false })
    .limit(100);

  if (search?.trim()) {
    const term = search.trim().replace(/[%,]/g, "");
    query = query.or(`full_name.ilike.%${term}%,nim.ilike.%${term}%`);
  }

  const { data } = await query;
  return (data as AdminMember[] | null) ?? [];
}

export type AuditEntry = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  actor: { full_name: string; role: UserRole } | null;
};

export async function getAuditLog(limit = 100): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select(
      "id, action, target_type, target_id, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name, role)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as AuditEntry[] | null) ?? [];
}

export type TrendPoint = { label: string; value: number };

export type CommunityTrend = {
  members: TrendPoint[];
  forum: TrendPoint[];
  cbt: TrendPoint[];
  /** Mean CBT score as a percentage, or null when nobody has finished one. */
  cbtAverage: number | null;
  peduli: { collected: number; cases: number };
};

const MONTH_LABEL = new Intl.DateTimeFormat("id-ID", { month: "short" });

/** The last twelve month buckets, oldest first, so an empty month still shows. */
function emptyMonths(): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABEL.format(d),
    };
  });
}

function bucket(months: { key: string; label: string }[], dates: unknown[]) {
  const counts = new Map(months.map((m) => [m.key, 0]));
  for (const value of dates) {
    if (typeof value !== "string") continue;
    const d = new Date(value);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
}

/**
 * Twelve months of community activity for the admin overview.
 *
 * Bucketed in JS rather than with a SQL `date_trunc` group-by: these tables
 * are small, this is one round trip per series instead of a view to maintain,
 * and an empty month has to appear as a zero column either way — a group-by
 * simply omits it.
 */
export async function getCommunityTrend(): Promise<CommunityTrend> {
  const supabase = await createClient();
  const months = emptyMonths();
  const from = new Date();
  from.setMonth(from.getMonth() - 11, 1);
  const since = new Date(from.getFullYear(), from.getMonth(), 1).toISOString();

  const [profiles, threads, replies, attempts, peduli] = await Promise.all([
    supabase.from("profiles").select("created_at").gte("created_at", since),
    supabase.from("forum_threads").select("created_at").gte("created_at", since),
    supabase.from("forum_replies").select("created_at").gte("created_at", since),
    supabase
      .from("cbt_attempts")
      .select("started_at, score, total_questions, finished_at")
      .gte("started_at", since),
    supabase.from("peduli_cases").select("collected_amount"),
  ]);

  const forumDates = [
    ...(threads.data ?? []).map((r) => r.created_at),
    ...(replies.data ?? []).map((r) => r.created_at),
  ];

  const finished = (attempts.data ?? []).filter(
    (r) => r.finished_at && Number(r.total_questions) > 0,
  );

  const cbtAverage =
    finished.length === 0
      ? null
      : Math.round(
          (finished.reduce(
            (sum, r) => sum + Number(r.score) / Number(r.total_questions),
            0,
          ) /
            finished.length) *
            100,
        );

  return {
    members: bucket(months, (profiles.data ?? []).map((r) => r.created_at)),
    forum: bucket(months, forumDates),
    cbt: bucket(months, (attempts.data ?? []).map((r) => r.started_at)),
    cbtAverage,
    peduli: {
      collected: (peduli.data ?? []).reduce(
        (sum, r) => sum + Number(r.collected_amount ?? 0),
        0,
      ),
      cases: (peduli.data ?? []).length,
    },
  };
}
