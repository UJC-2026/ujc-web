import Image from "next/image";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deletePhoto, toggleFeatured } from "@/app/(app)/gallery/actions";
import { relativeTime } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/gallery/queries";

export function PhotoGrid({
  photos,
  viewerId,
  canManage,
}: {
  photos: GalleryPhoto[];
  viewerId?: string;
  canManage: boolean;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => {
        // Uploaders may remove their own photo until it is featured; after
        // that it belongs to the homepage and only pengurus can touch it.
        const canDelete =
          canManage || (photo.uploaded_by === viewerId && !photo.is_homepage_featured);

        return (
          <li
            key={photo.id}
            className="overflow-hidden rounded-card border border-border bg-surface"
          >
            <Image
              src={photo.image_url}
              alt={photo.caption ?? ""}
              width={640}
              height={480}
              className="aspect-[4/3] w-full object-cover"
            />

            <div className="p-4">
              {photo.is_homepage_featured && (
                <Badge variant="accent">
                  <Star aria-hidden />
                  Tampil di beranda
                </Badge>
              )}

              {photo.caption && (
                <p className="mt-2 text-body text-foreground">{photo.caption}</p>
              )}

              <p className="mt-1.5 text-caption text-muted-foreground">
                {photo.uploader ? (
                  <Link
                    href={`/members/${photo.uploader.id}`}
                    className="transition-colors hover:text-primary"
                  >
                    {photo.uploader.full_name}
                  </Link>
                ) : (
                  "Anggota UJC"
                )}
                {" · "}
                {relativeTime(photo.created_at)}
              </p>

              {(canManage || canDelete) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {canManage && (
                    <form action={toggleFeatured}>
                      <input type="hidden" name="photoId" value={photo.id} />
                      <input
                        type="hidden"
                        name="featured"
                        value={String(photo.is_homepage_featured)}
                      />
                      <button
                        type="submit"
                        className="rounded-field border border-border px-3 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary"
                      >
                        {photo.is_homepage_featured
                          ? "Lepas dari beranda"
                          : "Tampilkan di beranda"}
                      </button>
                    </form>
                  )}

                  {canDelete && (
                    <form action={deletePhoto}>
                      <input type="hidden" name="photoId" value={photo.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 rounded-field border border-border px-3 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:border-danger hover:text-danger"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Hapus
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
