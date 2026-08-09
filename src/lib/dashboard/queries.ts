import { createClient } from "@/lib/supabase/server";
import type { Divisi } from "@/lib/supabase/types";

/**
 * PostgREST returns a to-one embed as an object, but the generated types widen
 * it to an array. Normalizing both shapes keeps the call sites honest instead
 * of casting the difference away.
 */
function toOne<T>(embed: unknown): T | null {
  if (embed == null) return null;
  if (Array.isArray(embed)) return (embed[0] as T | undefined) ?? null;
  return embed as T;
}

export type MemberSummary = {
  points: number;
  level: number;
  threads: number;
  replies: number;
  eventsJoined: number;
};

export async function getMemberSummary(userId: string): Promise<MemberSummary> {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };

  const [points, threads, replies, rsvps] = await Promise.all([
    supabase.from("user_points").select("points").eq("user_id", userId),
    supabase.from("forum_threads").select("id", head).eq("author_id", userId),
    supabase.from("forum_replies").select("id", head).eq("author_id", userId),
    supabase
      .from("event_rsvp")
      .select("id", head)
      .eq("user_id", userId)
      .eq("status", "hadir"),
  ]);

  const total = (points.data ?? []).reduce(
    (sum, row) => sum + (row.points as number),
    0,
  );

  return {
    points: total,
    level: Math.floor(total / 100) + 1,
    threads: threads.count ?? 0,
    replies: replies.count ?? 0,
    eventsJoined: rsvps.count ?? 0,
  };
}

export type LeaderboardRow = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
};

/**
 * Monthly ranking. The RPC leaves out members who hid their profile, so
 * opting out of the directory also opts you out of the public ranking.
 */
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data } = await supabase.rpc("points_leaderboard", {
    since: since.toISOString(),
  });

  return (data ?? []).map(
    (row: { user_id: string; full_name: string; avatar_url: string | null; total_points: number }) => ({
      ...row,
      total_points: Number(row.total_points),
    }),
  );
}

export type ActivityItem = {
  id: string;
  kind: "thread" | "reply";
  title: string;
  href: string | null;
  createdAt: string;
};

export async function getRecentActivity(
  userId: string,
): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const [threads, replies] = await Promise.all([
    supabase
      .from("forum_threads")
      .select("id, title, created_at, category:forum_categories(slug)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("forum_replies")
      .select(
        "id, created_at, thread:forum_threads(id, title, category:forum_categories(slug))",
      )
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: ActivityItem[] = [];

  for (const row of threads.data ?? []) {
    const category = toOne<{ slug: string }>(row.category);
    items.push({
      id: row.id as string,
      kind: "thread",
      title: row.title as string,
      href: category ? `/forum/${category.slug}/${row.id}` : null,
      createdAt: row.created_at as string,
    });
  }

  for (const row of replies.data ?? []) {
    const thread = toOne<{ id: string; title: string; category: unknown }>(
      row.thread,
    );
    const category = toOne<{ slug: string }>(thread?.category);
    items.push({
      id: row.id as string,
      kind: "reply",
      title: thread ? thread.title : "Balasan",
      href:
        thread && category ? `/forum/${category.slug}/${thread.id}` : null,
      createdAt: row.created_at as string,
    });
  }

  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
}

export type Program = {
  id: string;
  divisi: Divisi;
  title: string;
  description: string | null;
  target: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: "rencana" | "berjalan" | "selesai" | "tertunda";
  pic: { full_name: string; avatar_url: string | null } | null;
};

const PIC_FIELDS = "pic:profiles!programs_pic_id_fkey(full_name, avatar_url)";

export async function getPrograms(divisi?: Divisi[]): Promise<Program[]> {
  const supabase = await createClient();

  let query = supabase
    .from("programs")
    .select(`*, ${PIC_FIELDS}`)
    .order("end_date", { ascending: true, nullsFirst: false });

  if (divisi && divisi.length > 0) query = query.in("divisi", divisi);

  const { data } = await query;
  return (data as Program[] | null) ?? [];
}

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "rendah" | "sedang" | "tinggi";
  status: "todo" | "dikerjakan" | "selesai";
  assignee: { full_name: string; avatar_url: string | null } | null;
  program: { title: string } | null;
};

const TASK_FIELDS =
  "*, assignee:profiles!tasks_assigned_to_fkey(full_name, avatar_url), program:programs(title)";

export async function getTasks({
  assignedTo,
  openOnly = false,
}: {
  assignedTo?: string;
  openOnly?: boolean;
} = {}): Promise<Task[]> {
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (assignedTo) query = query.eq("assigned_to", assignedTo);
  if (openOnly) query = query.neq("status", "selesai");

  const { data } = await query;
  return (data as Task[] | null) ?? [];
}

export type PengurusOption = {
  id: string;
  full_name: string;
  divisi: Divisi;
};

/** Active pengurus in the active period — the people a task can be given to. */
export async function getPengurusOptions(): Promise<PengurusOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pengurus")
    .select(
      "divisi, profile:profiles!pengurus_user_id_fkey(id, full_name), org_periods!inner(is_active)",
    )
    .eq("is_active", true)
    .eq("org_periods.is_active", true);

  const seen = new Set<string>();
  const options: PengurusOption[] = [];

  for (const row of data ?? []) {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!profile || seen.has(profile.id)) continue;
    seen.add(profile.id);
    options.push({
      id: profile.id,
      full_name: profile.full_name,
      divisi: row.divisi as Divisi,
    });
  }

  return options.sort((a, b) => a.full_name.localeCompare(b.full_name, "id"));
}

export type MeetingNote = {
  id: string;
  title: string;
  content: string | null;
  meeting_date: string;
  author: { full_name: string } | null;
};

export type OrgDocument = {
  id: string;
  title: string;
  category: string | null;
  /** A signed, short-lived URL by the time it reaches a component. */
  file_url: string;
  created_at: string;
  /** The row survived but its file did not — shown as an unclickable entry. */
  isMissing?: boolean;
};

export async function getAdministrasi(): Promise<{
  notes: MeetingNote[];
  documents: OrgDocument[];
}> {
  const supabase = await createClient();

  const [notes, documents] = await Promise.all([
    supabase
      .from("meeting_notes")
      .select(
        "id, title, content, meeting_date, author:profiles!meeting_notes_created_by_fkey(full_name)",
      )
      .order("meeting_date", { ascending: false })
      .limit(20),
    supabase
      .from("documents")
      .select("id, title, category, file_url, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    notes: (notes.data as MeetingNote[] | null) ?? [],
    documents: await signDocuments(
      supabase,
      (documents.data as OrgDocument[] | null) ?? [],
    ),
  };
}

/**
 * Turns stored object keys into links that will actually open.
 *
 * The `documents` bucket is private, so a key is not a URL and cannot be made
 * into one by string concatenation — it has to be signed, and the signature
 * expires. Ten minutes is enough to click through from the panel and short
 * enough that a link pasted elsewhere stops working.
 *
 * Rows written before uploads existed hold a plain external URL. Those are
 * passed through untouched rather than migrated: signing something that was
 * never in the bucket would only replace a working link with a broken one.
 */
async function signDocuments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: OrgDocument[],
): Promise<OrgDocument[]> {
  const keys = rows
    .map((row) => row.file_url)
    .filter((value) => !/^https?:\/\//i.test(value));

  if (keys.length === 0) return rows;

  const { data } = await supabase.storage
    .from("documents")
    .createSignedUrls(keys, 600);

  const signed = new Map(
    (data ?? [])
      .filter((entry) => entry.signedUrl)
      .map((entry) => [entry.path as string, entry.signedUrl]),
  );

  return rows.map((row) => ({
    ...row,
    // A key with no signature means the object is gone from the bucket. The
    // row keeps its title so the archive still shows what was filed.
    file_url: signed.get(row.file_url) ?? row.file_url,
    isMissing: !/^https?:\/\//i.test(row.file_url) && !signed.has(row.file_url),
  }));
}

export type ContentSlot = {
  id: string;
  title: string;
  type: string | null;
  scheduled_at: string;
  status: string;
  assignee: { full_name: string } | null;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  channel: string[];
  sent_at: string | null;
};

export async function getMediaWorkspace(): Promise<{
  slots: ContentSlot[];
  announcements: Announcement[];
}> {
  const supabase = await createClient();

  const [slots, announcements] = await Promise.all([
    supabase
      .from("content_calendar")
      .select(
        "id, title, type, scheduled_at, status, assignee:profiles!content_calendar_assigned_to_fkey(full_name)",
      )
      .order("scheduled_at", { ascending: true })
      .limit(20),
    supabase
      .from("announcements")
      .select("id, title, content, channel, sent_at")
      .order("sent_at", { ascending: false, nullsFirst: true })
      .limit(10),
  ]);

  return {
    slots: (slots.data as ContentSlot[] | null) ?? [],
    announcements: (announcements.data as Announcement[] | null) ?? [],
  };
}

export type CbtCategory = {
  id: string;
  name: string;
  type: "jlpt" | "ssw";
  level: string | null;
  duration_minutes: number;
  is_published: boolean;
  questionCount: number;
};

/** Overrides for the weekend reminder; null means the built-in wording. */
export type AcademicReminder = {
  title: string | null;
  body: string | null;
  link: string | null;
};

export async function getAkademikWorkspace(): Promise<{
  categories: CbtCategory[];
  resourceCount: number;
  reminder: AcademicReminder;
}> {
  const supabase = await createClient();

  const [categories, questions, resources, settings] = await Promise.all([
    supabase
      .from("cbt_test_categories")
      .select("id, name, type, level, duration_minutes, is_published")
      .order("type")
      .order("level"),
    // Counting client-side keeps this to one round trip instead of one per
    // category; the question bank is small enough for that to be cheaper.
    supabase.from("cbt_questions").select("category_id"),
    supabase.from("resources").select("id", { count: "exact", head: true }),
    supabase
      .from("site_settings")
      .select("key, value")
      .like("key", "academic\\_reminder\\_%"),
  ]);

  const tally = new Map<string, number>();
  for (const row of questions.data ?? []) {
    const key = row.category_id as string;
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }

  const setting = new Map(
    (settings.data ?? []).map((row) => [row.key as string, row.value as string | null]),
  );

  return {
    categories: (categories.data ?? []).map((row) => ({
      ...(row as Omit<CbtCategory, "questionCount">),
      questionCount: tally.get(row.id as string) ?? 0,
    })),
    resourceCount: resources.count ?? 0,
    reminder: {
      title: setting.get("academic_reminder_title") ?? null,
      body: setting.get("academic_reminder_body") ?? null,
      link: setting.get("academic_reminder_link") ?? null,
    },
  };
}

export type BoardReply = {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string; avatar_url: string | null } | null;
};

export type BoardPost = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author_id: string;
  author: { full_name: string; avatar_url: string | null } | null;
  replies: BoardReply[];
};

export async function getBoardPosts(): Promise<BoardPost[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("internal_board")
    .select(
      `id, title, content, is_pinned, created_at, author_id,
       author:profiles!internal_board_author_id_fkey(full_name, avatar_url)`,
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  const posts = (data ?? []).map((row) => ({
    ...(row as Record<string, unknown>),
    author: toOne<{ full_name: string; avatar_url: string | null }>(row.author),
  })) as Omit<BoardPost, "replies">[];

  if (posts.length === 0) return [];

  // One query for every reply, then grouped in memory — cheaper than a
  // per-post round trip once the board has any depth.
  const { data: replyRows } = await supabase
    .from("internal_board_replies")
    .select(
      `id, board_id, content, created_at,
       author:profiles!internal_board_replies_author_id_fkey(full_name, avatar_url)`,
    )
    .in(
      "board_id",
      posts.map((post) => post.id),
    )
    .order("created_at", { ascending: true });

  const byPost = new Map<string, BoardReply[]>();
  for (const row of replyRows ?? []) {
    const key = row.board_id as string;
    const list = byPost.get(key) ?? [];
    list.push({
      id: row.id as string,
      content: row.content as string,
      created_at: row.created_at as string,
      author: toOne<{ full_name: string; avatar_url: string | null }>(row.author),
    });
    byPost.set(key, list);
  }

  return posts.map((post) => ({
    ...post,
    replies: byPost.get(post.id) ?? [],
  }));
}

export type CalendarEntry = {
  id: string;
  title: string;
  kind: "rapat" | "event" | "deadline" | "penting" | "proker" | "tugas";
  at: string;
  detail: string | null;
  href: string | null;
  /** Decided here rather than at render time, which must stay pure. */
  isPast: boolean;
};

/**
 * The unified calendar the pengurus panel promises: explicit calendar rows
 * plus the dates that already exist elsewhere (public events, proker end
 * dates, task deadlines) so nothing has to be entered twice.
 */
export async function getUnifiedCalendar(): Promise<CalendarEntry[]> {
  const supabase = await createClient();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() - 7);
  const from = horizon.toISOString();

  const [calendar, events, programs, tasks] = await Promise.all([
    supabase
      .from("internal_calendar")
      .select("id, title, type, start_at")
      .gte("start_at", from)
      .order("start_at"),
    supabase
      .from("events")
      .select("id, title, event_date, location, is_online")
      .gte("event_date", from)
      .order("event_date"),
    supabase
      .from("programs")
      .select("id, title, end_date, divisi")
      .not("end_date", "is", null)
      .gte("end_date", from.slice(0, 10))
      .neq("status", "selesai"),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority")
      .not("due_date", "is", null)
      .gte("due_date", from.slice(0, 10))
      .neq("status", "selesai"),
  ]);

  const entries: CalendarEntry[] = [];

  for (const row of calendar.data ?? []) {
    entries.push({
      id: `cal-${row.id}`,
      title: row.title as string,
      kind: row.type as CalendarEntry["kind"],
      at: row.start_at as string,
      detail: null,
      href: null,
      isPast: false,
    });
  }

  for (const row of events.data ?? []) {
    entries.push({
      id: `ev-${row.id}`,
      title: row.title as string,
      kind: "event",
      at: row.event_date as string,
      detail: row.is_online ? "Daring" : ((row.location as string) ?? null),
      href: `/events/${row.id}`,
      isPast: false,
    });
  }

  for (const row of programs.data ?? []) {
    entries.push({
      id: `pr-${row.id}`,
      title: `Tenggat proker: ${row.title}`,
      kind: "proker",
      at: `${row.end_date}T23:59:00`,
      detail: DIVISI_SHORT[row.divisi as string] ?? null,
      href: "/dashboard?panel=proker",
      isPast: false,
    });
  }

  for (const row of tasks.data ?? []) {
    entries.push({
      id: `ts-${row.id}`,
      title: `Tenggat tugas: ${row.title}`,
      kind: "tugas",
      at: `${row.due_date}T23:59:00`,
      detail: `Prioritas ${row.priority}`,
      href: "/dashboard?panel=tugas",
      isPast: false,
    });
  }

  const now = Date.now();
  return entries
    .map((entry) => ({ ...entry, isPast: new Date(entry.at).getTime() < now }))
    .sort((a, b) => a.at.localeCompare(b.at));
}

const DIVISI_SHORT: Record<string, string> = {
  ketua: "Ketua",
  wakil: "Wakil",
  sekretaris: "Sekretaris",
  bendahara: "Bendahara",
  media: "Media",
  pendidikan: "Pendidikan",
  acara: "Kegiatan",
};

export type CashSummary = {
  income: number;
  expense: number;
  balance: number;
  recent: {
    id: string;
    type: "pemasukan" | "pengeluaran";
    category: string | null;
    description: string | null;
    amount: number;
    occurred_on: string;
  }[];
};

export async function getCashSummary(): Promise<CashSummary> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("finance_transactions")
    .select("id, type, category, description, amount, occurred_on")
    .order("occurred_on", { ascending: false });

  const rows = data ?? [];
  let income = 0;
  let expense = 0;

  for (const row of rows) {
    if (row.type === "pemasukan") income += row.amount as number;
    else expense += row.amount as number;
  }

  return {
    income,
    expense,
    balance: income - expense,
    recent: rows.slice(0, 10) as CashSummary["recent"],
  };
}
