import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Download, ExternalLink } from "lucide-react";
import { getResources, getResourceCategories } from "@/lib/resources/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resource",
  description:
    "Panduan visa, template CV, info kampus, dan tips kerja di Jepang untuk anggota UJC.",
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;

  const [resources, categories] = await Promise.all([
    getResources(kategori),
    getResourceCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-xl">
        <h1 className="rule-gold text-h1 text-foreground">Resource</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Kumpulan panduan yang sering ditanyakan: urusan visa, template CV,
          info kampus, sampai tips kerja di Jepang.
        </p>
      </Reveal>

      {categories.length > 0 && (
        <div
          role="group"
          aria-label="Saring kategori"
          className="mt-9 flex flex-wrap gap-1.5"
        >
          <Link
            href="/resources"
            aria-current={!kategori ? "true" : undefined}
            className={cn(
              "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
              !kategori
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
            )}
          >
            Semua
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/resources?kategori=${encodeURIComponent(category)}`}
              aria-current={kategori === category ? "true" : undefined}
              className={cn(
                "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
                kategori === category
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
              )}
            >
              {category}
            </Link>
          ))}
        </div>
      )}

      {resources.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={BookOpen}
            title={
              kategori ? "Belum ada resource di kategori ini" : "Belum ada resource"
            }
            description="Divisi Pendidikan belum menambahkan materi di sini. Kalau kamu punya panduan yang berguna, kabari pengurus, ya."
          />
        </div>
      ) : (
        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => {
            const href = resource.link ?? resource.file_url;
            const isDownload = !resource.link && Boolean(resource.file_url);

            return (
              <RevealItem key={resource.id}>
                <Card interactive className="relative flex h-full flex-col">
                  {resource.category && (
                    <Badge variant="outline" className="self-start">
                      {resource.category}
                    </Badge>
                  )}

                  <CardTitle className="mt-3">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-primary"
                      >
                        <span className="absolute inset-0" aria-hidden />
                        {resource.title}
                      </a>
                    ) : (
                      resource.title
                    )}
                  </CardTitle>

                  {resource.description && (
                    <CardDescription className="mt-2 text-body">
                      {resource.description}
                    </CardDescription>
                  )}

                  {href && (
                    <p className="mt-5 flex items-center gap-1.5 text-caption font-medium text-accent">
                      {isDownload ? (
                        <>
                          <Download className="size-4" aria-hidden />
                          Unduh berkas
                        </>
                      ) : (
                        <>
                          <ExternalLink className="size-4" aria-hidden />
                          Buka tautan
                        </>
                      )}
                    </p>
                  )}
                </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>
      )}
    </div>
  );
}
