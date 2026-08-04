export type UserRole = "admin" | "moderator" | "member";

export type Divisi =
  | "ketua"
  | "wakil"
  | "sekretaris"
  | "bendahara"
  | "media"
  | "pendidikan"
  | "acara";

export type Profile = {
  id: string;
  full_name: string;
  nim: string | null;
  kelas: string | null;
  city: string | null;
  prefecture: string | null;
  major: string | null;
  angkatan: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  motto: string | null;
  social_links: Record<string, string>;
  role: UserRole;
  is_verified: boolean;
  is_profile_public: boolean;
  onboarded_at: string | null;
  join_date: string;
  created_at: string;
  updated_at: string;
};

export const DIVISI_LABEL: Record<Divisi, string> = {
  ketua: "Ketua Umum",
  wakil: "Wakil Ketua",
  sekretaris: "Sekretaris",
  bendahara: "Bendahara",
  media: "Divisi Media & Publikasi",
  pendidikan: "Divisi Pendidikan",
  acara: "Divisi Kegiatan",
};
