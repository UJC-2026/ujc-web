import { createClient } from "@/lib/supabase/server";

export type GalleryPhoto = {
  id: string;
  uploaded_by: string;
  image_url: string;
  caption: string | null;
  is_homepage_featured: boolean;
  created_at: string;
  uploader: { id: string; full_name: string } | null;
};

const UPLOADER =
  "uploader:profiles!gallery_photos_uploaded_by_fkey(id, full_name)";

function normalize(row: Record<string, unknown>): GalleryPhoto {
  const uploader = Array.isArray(row.uploader) ? row.uploader[0] : row.uploader;
  return {
    ...(row as unknown as GalleryPhoto),
    uploader: (uploader as GalleryPhoto["uploader"]) ?? null,
  };
}

export async function getPhotos(featuredOnly = false): Promise<GalleryPhoto[]> {
  const supabase = await createClient();

  let query = supabase
    .from("gallery_photos")
    .select(`*, ${UPLOADER}`)
    .order("created_at", { ascending: false });

  if (featuredOnly) query = query.eq("is_homepage_featured", true);

  const { data } = await query;
  return (data ?? []).map((row) => normalize(row as Record<string, unknown>));
}
