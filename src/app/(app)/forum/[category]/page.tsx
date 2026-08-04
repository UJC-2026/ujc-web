import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessagesSquare, PenLine, SearchX } from "lucide-react";
import { getCategoryBySlug, getThreads } from "@/lib/forum/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { isThreadSort, THREADS_PER_PAGE } from "@/lib/forum/types";
import { ThreadCard } from "@/components/forum/thread-card";
import { ThreadFilters } from "@/components/forum/thread-filters";
import { Pagination } from "@/components/forum/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; q?: string; page?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "Kategori tidak ditemukan" };

  return {
    title: `${category.name} · Forum`,
    description:
      category.description ?? `Diskusi kategori ${category.name} di forum UJC.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { category: slug } = await params;
  const { sort: sortParam, q, page: pageParam } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sort = isThreadSort(sortParam) ? sortParam : "terbaru";
  const search = q ?? "";
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ threads, total }, user] = await Promise.all([
    getThreads({ categoryId: category.id, sort, search, page }),
    getCurrentUser(),
  ]);

  const totalPages = Math.ceil(total / THREADS_PER_PAGE);
  const basePath = `/forum/${category.slug}`;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/forum" className="transition-colors hover:text-primary">
          Forum
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="rule-gold text-h1 text-foreground">{category.name}</h1>
          {category.description && (
            <p className="mt-5 text-body text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>
        <Button asChild>
          <Link
            href={
              user
                ? `/forum/new?category=${category.slug}`
                : `/login?next=/forum/new`
            }
          >
            <PenLine aria-hidden />
            Buat thread
          </Link>
        </Button>
      </div>

      <div className="mt-9">
        <ThreadFilters basePath={basePath} sort={sort} search={search} />
      </div>

      <p className="mt-6 text-caption text-muted-foreground">
        {total.toLocaleString("id-ID")} diskusi
        {search && ` untuk “${search}”`}
      </p>

      {threads.length === 0 ? (
        <div className="mt-6">
          {search ? (
            <EmptyState
              icon={SearchX}
              title="Tidak ada yang cocok"
              description={`Tidak ada diskusi yang cocok dengan “${search}”. Coba kata kunci lain.`}
              action={
                <Button asChild variant="outline">
                  <Link href={basePath}>Hapus pencarian</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="Belum ada diskusi di sini"
              description="Jadi yang pertama memulai! Pertanyaanmu mungkin juga jadi jawaban buat anggota lain."
              action={
                <Button asChild>
                  <Link
                    href={
                      user
                        ? `/forum/new?category=${category.slug}`
                        : `/login?next=/forum/new`
                    }
                  >
                    Mulai diskusi
                  </Link>
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                categorySlug={category.slug}
              />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Pagination
              basePath={basePath}
              params={{ sort, q: search }}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </>
      )}
    </div>
  );
}
