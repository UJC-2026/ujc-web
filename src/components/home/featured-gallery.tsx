import Image from "next/image";
import Link from "next/link";
import { Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import type { GalleryPhoto } from "@/lib/gallery/queries";

/**
 * Only photos pengurus have marked `is_homepage_featured` reach this section —
 * members can upload to the gallery freely, but not onto the front page.
 */
export function FeaturedGallery({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="rule-gold text-h2 text-foreground">
            Wajah komunitas kami
          </h2>
          <p className="mt-5 text-body text-muted-foreground">
            Kopdar, workshop, dan momen sehari-hari anggota UJC di berbagai
            prefektur.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/gallery">
            <Images aria-hidden />
            Lihat galeri
          </Link>
        </Button>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <RevealItem key={photo.id}>
            <figure className="overflow-hidden rounded-card border border-border bg-surface">
              <Image
                src={photo.image_url}
                alt={photo.caption ?? ""}
                width={640}
                height={480}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
              />
              {photo.caption && (
                <figcaption className="p-4 text-caption text-muted-foreground">
                  {photo.caption}
                </figcaption>
              )}
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
