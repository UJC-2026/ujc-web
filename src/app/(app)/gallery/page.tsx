import type { Metadata } from "next";
import Link from "next/link";
import { Images } from "lucide-react";
import { getPhotos } from "@/lib/gallery/queries";
import { getCurrentProfile, getPengurusRoles } from "@/lib/auth/session";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import { GalleryUploadForm } from "@/components/gallery/upload-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Galeri",
  description:
    "Dokumentasi kegiatan UNSIA Japan Community — kopdar, workshop, dan keseharian anggota di Jepang.",
};

export default async function GalleryPage() {
  const profile = await getCurrentProfile();
  const [photos, roles] = await Promise.all([
    getPhotos(),
    profile ? getPengurusRoles(profile.id) : Promise.resolve([]),
  ]);

  const canManage = roles.length > 0 || profile?.role === "admin";
  const featured = photos.filter((photo) => photo.is_homepage_featured);
  const rest = photos.filter((photo) => !photo.is_homepage_featured);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-xl">
        <h1 className="rule-gold text-h1 text-foreground">Galeri</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Dokumentasi kegiatan dan keseharian anggota. Semua anggota boleh
          menambahkan foto — yang tampil di beranda dipilih pengurus.
        </p>
      </Reveal>

      <div className="mt-8">
        {profile ? (
          <GalleryUploadForm />
        ) : (
          <Button asChild variant="outline">
            <Link href="/login?next=/gallery">Masuk untuk mengunggah</Link>
          </Button>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Images}
            title="Galeri masih kosong"
            description="Belum ada foto yang diunggah. Punya dokumentasi kegiatan? Jadi yang pertama."
          />
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mt-12">
              <h2 className="text-h2 text-foreground">Tampil di beranda</h2>
              <div className="mt-7">
                <PhotoGrid
                  photos={featured}
                  viewerId={profile?.id}
                  canManage={canManage}
                />
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="mt-12">
              <h2 className="text-h2 text-foreground">
                {featured.length > 0 ? "Foto lainnya" : "Semua foto"}
              </h2>
              <div className="mt-7">
                <PhotoGrid
                  photos={rest}
                  viewerId={profile?.id}
                  canManage={canManage}
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
