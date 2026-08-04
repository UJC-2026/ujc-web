import type { Divisi } from "@/lib/supabase/types";

export type PanelId =
  | "ringkasan"
  | "aktivitas"
  | "perhatian"
  | "proker"
  | "tugas"
  | "keuangan"
  | "kegiatan"
  | "administrasi"
  | "media"
  | "akademik"
  | "papan"
  | "kalender"
  | "peduli";

export type PanelDef = {
  id: PanelId;
  label: string;
  group: "anggota" | "pengurus";
  /**
   * The division this panel belongs to. Kept for labelling only — every
   * pengurus may open every panel so they can cover for each other. See
   * migration 0009.
   */
  divisi?: Divisi[];
};

/**
 * Single source of truth for the sidebar and for access checks, so a panel can
 * never appear in the menu without the server also allowing it.
 */
export const PANELS: PanelDef[] = [
  { id: "ringkasan", label: "Ringkasan", group: "anggota" },
  { id: "aktivitas", label: "Aktivitas terbaru", group: "anggota" },

  { id: "perhatian", label: "Butuh perhatianmu", group: "pengurus" },
  { id: "papan", label: "Papan internal", group: "pengurus" },
  { id: "kalender", label: "Kalender terpadu", group: "pengurus" },
  { id: "proker", label: "Program kerja", group: "pengurus" },
  { id: "tugas", label: "Tugas", group: "pengurus" },

  { id: "keuangan", label: "Keuangan", group: "pengurus" },
  { id: "kegiatan", label: "Kegiatan", group: "pengurus" },
  {
    // Deliberately narrower than the other pengurus panels: pending cases
    // contain illness, bereavement, and money trouble. See migration 0011.
    id: "peduli",
    label: "UJC Peduli",
    group: "pengurus",
    divisi: ["ketua", "wakil", "bendahara"],
  },
  { id: "administrasi", label: "Administrasi", group: "pengurus" },
  { id: "media", label: "Media & publikasi", group: "pengurus" },
  { id: "akademik", label: "Akademik", group: "pengurus" },
];

export function isPanelId(value: string | undefined): value is PanelId {
  return PANELS.some((panel) => panel.id === value);
}

/**
 * Panels this user may open. Every active pengurus sees the whole workspace so
 * they can pick up work for a division that is short-handed; only the
 * member/pengurus split still gates anything.
 */
export function visiblePanels(roles: Divisi[]): PanelDef[] {
  const isPengurus = roles.length > 0;

  return PANELS.filter((panel) => {
    if (panel.group === "anggota") return true;
    if (!isPengurus) return false;
    // Most panels are open to every pengurus so they can cover for each
    // other; the few that still carry a divisi list hold sensitive personal
    // data and stay restricted to it.
    if (!panel.divisi) return true;
    return panel.divisi.some((divisi) => roles.includes(divisi));
  });
}

export function canOpenPanel(panel: PanelId, roles: Divisi[]) {
  return visiblePanels(roles).some((def) => def.id === panel);
}
