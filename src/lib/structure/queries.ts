import { createClient } from "@/lib/supabase/server";

export type OrgPeriod = {
  id: string;
  year_label: string;
  is_active: boolean;
};

export type OrgMember = {
  id: string;
  position_id: string;
  user_id: string | null;
  display_name: string;
  photo_url: string | null;
  motto: string | null;
  city: string | null;
  contact: Record<string, string>;
  status: "aktif" | "alumni" | "cuti";
  sort_order: number;
};

export type OrgPosition = {
  id: string;
  period_id: string;
  parent_position_id: string | null;
  name: string;
  description: string | null;
  cover_url: string | null;
  sort_order: number;
  members: OrgMember[];
  children: OrgPosition[];
  /** Includes members of every descendant position. */
  totalMembers: number;
};

export async function getPeriods(): Promise<OrgPeriod[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_periods")
    .select("id, year_label, is_active")
    .order("year_label", { ascending: false });

  return (data as OrgPeriod[] | null) ?? [];
}

/**
 * Builds the position hierarchy for one period. The table is
 * self-referencing, so the tree is assembled in memory rather than with a
 * recursive query per level.
 */
export async function getStructure(periodId: string): Promise<OrgPosition[]> {
  const supabase = await createClient();

  const [positions, members] = await Promise.all([
    supabase
      .from("org_positions")
      .select("*")
      .eq("period_id", periodId)
      .order("sort_order"),
    supabase.from("org_members").select("*").order("sort_order"),
  ]);

  const membersByPosition = new Map<string, OrgMember[]>();
  for (const row of (members.data ?? []) as OrgMember[]) {
    const list = membersByPosition.get(row.position_id) ?? [];
    list.push(row);
    membersByPosition.set(row.position_id, list);
  }

  const nodes = new Map<string, OrgPosition>();
  for (const row of positions.data ?? []) {
    nodes.set(row.id as string, {
      ...(row as unknown as OrgPosition),
      members: membersByPosition.get(row.id as string) ?? [],
      children: [],
      totalMembers: 0,
    });
  }

  const roots: OrgPosition[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_position_id
      ? nodes.get(node.parent_position_id)
      : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  // Depth-first so a parent's total includes everything beneath it.
  const tally = (node: OrgPosition): number => {
    node.totalMembers =
      node.members.length +
      node.children.reduce((sum, child) => sum + tally(child), 0);
    return node.totalMembers;
  };
  roots.forEach(tally);

  const bySort = (a: OrgPosition, b: OrgPosition) => a.sort_order - b.sort_order;
  const sortTree = (list: OrgPosition[]) => {
    list.sort(bySort);
    list.forEach((node) => sortTree(node.children));
  };
  sortTree(roots);

  return roots;
}

export async function getPosition(id: string): Promise<{
  position: OrgPosition;
  parent: OrgPosition | null;
  period: OrgPeriod | null;
} | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("org_positions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const [members, children, parent, period] = await Promise.all([
    supabase
      .from("org_members")
      .select("*")
      .eq("position_id", id)
      .order("sort_order"),
    supabase
      .from("org_positions")
      .select("*")
      .eq("parent_position_id", id)
      .order("sort_order"),
    data.parent_position_id
      ? supabase
          .from("org_positions")
          .select("*")
          .eq("id", data.parent_position_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("org_periods")
      .select("id, year_label, is_active")
      .eq("id", data.period_id)
      .maybeSingle(),
  ]);

  const position: OrgPosition = {
    ...(data as unknown as OrgPosition),
    members: (members.data as OrgMember[] | null) ?? [],
    children: ((children.data ?? []) as OrgPosition[]).map((child) => ({
      ...child,
      members: [],
      children: [],
      totalMembers: 0,
    })),
    totalMembers: (members.data ?? []).length,
  };

  return {
    position,
    parent: (parent.data as OrgPosition | null) ?? null,
    period: (period.data as OrgPeriod | null) ?? null,
  };
}

/** Flattened search across a period, for the "cari pengurus" box. */
export function searchMembers(
  tree: OrgPosition[],
  term: string,
): { member: OrgMember; position: OrgPosition }[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];

  const found: { member: OrgMember; position: OrgPosition }[] = [];

  const walk = (nodes: OrgPosition[]) => {
    for (const node of nodes) {
      for (const member of node.members) {
        const haystack = [member.display_name, member.city, node.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (haystack.includes(needle)) found.push({ member, position: node });
      }
      walk(node.children);
    }
  };

  walk(tree);
  return found;
}
