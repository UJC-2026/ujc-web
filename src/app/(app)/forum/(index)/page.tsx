import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare, PenLine } from "lucide-react";
import { getCategories, getCategoryThreadCounts } from "@/lib/forum/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { categoryIcon } from "@/components/forum/category-icon";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Forum",
  description:
    "Diskusi anggota UJC seputar akademik, kehidupan di Jepang, kerja, dan visa.",
};

export default async function ForumPage() {
  const [categories, counts, user] = await Promise.all([
    getCategories(),
    getCategoryThreadCounts(),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="rule-gold text-h1 text-foreground">Forum</h1>
          <p className="mt-5 text-body text-muted-foreground">
            Tempat bertanya dan berbagi pengalaman. Kemungkinan besar ada
            anggota lain yang sudah pernah mengalami hal yang sama.
          </p>
        </div>
        <Button asChild>
          <Link href={user ? "/forum/new" : "/login?next=/forum/new"}>
            <PenLine aria-hidden />
            Buat thread
          </Link>
        </Button>
      </Reveal>

      {categories.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={MessagesSquare}
            title="Kategori forum belum disiapkan"
            description="Admin belum menambahkan kategori diskusi. Coba lagi nanti, ya."
          />
        </div>
      ) : (
        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = categoryIcon(category.icon);
            const count = counts[category.id] ?? 0;

            return (
              <RevealItem key={category.id}>
                <Link href={`/forum/${category.slug}`} className="block h-full">
                  <Card interactive className="h-full">
                    <span className="mb-4 flex size-11 items-center justify-center rounded-field bg-surface-muted text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription className="mt-2 text-body">
                      {category.description}
                    </CardDescription>
                    <p className="mt-5 text-caption font-medium text-accent">
                      {count.toLocaleString("id-ID")} diskusi
                    </p>
                  </Card>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      )}
    </div>
  );
}
