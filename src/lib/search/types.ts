/**
 * Shared between the server query and the client command palette, so it must
 * not import anything server-only — pulling `next/headers` in here would drag
 * it into the browser bundle.
 */
export type SearchKind =
  | "forum" | "blog" | "marketplace" | "jobs"
  | "events" | "resources" | "members" | "business";

export type SearchHit = {
  kind: SearchKind;
  id: string;
  title: string;
  snippet: string | null;
  href: string;
  rank: number;
};

export const KIND_LABEL: Record<SearchKind, string> = {
  forum: "Forum",
  blog: "Artikel",
  marketplace: "Marketplace",
  jobs: "Lowongan",
  events: "Kegiatan",
  resources: "Resource",
  members: "Anggota",
  business: "Bisnis anggota",
};
