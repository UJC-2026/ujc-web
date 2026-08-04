import type { Metadata } from "next";
import Link from "next/link";
import { NotebookPen, PenLine } from "lucide-react";
import { getBlogCategories, getPosts } from "@/lib/blog/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { PostCard } from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog komunitas",
  description:
    "Cerita panjang dari anggota UJC — pengalaman kerja, kuliah sambil bekerja, dan hidup sehari-hari di Jepang.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;

  const [posts, categories, user] = await Promise.all([
    getPosts(kategori),
    getBlogCategories(),
    getCurrentUser(),
  ]);

  // RLS also returns the caller's own drafts and, for pengurus, the review
  // queue — so they are shown separately instead of mixed into the feed.
  const published = posts.filter((post) => post.status === "terbit");
  const pending = posts.filter((post) => post.status !== "terbit");

  const chip = (active: boolean) =>
    cn(
      "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
    );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="rule-gold text-h1 text-foreground">Blog komunitas</h1>
          <p className="mt-5 text-body text-muted-foreground">
            Cerita yang butuh ruang lebih panjang daripada thread forum —
            pengalaman kerja, kuliah daring sambil bekerja, dan pelajaran hidup
            di Jepang.
          </p>
        </div>
        <Button asChild>
          <Link href={user ? "/blog/new" : "/login?next=/blog/new"}>
            <PenLine aria-hidden />
            Tulis artikel
          </Link>
        </Button>
      </Reveal>

      {categories.length > 0 && (
        <div role="group" aria-label="Saring kategori" className="mt-9 flex flex-wrap gap-1.5">
          <Link href="/blog" className={chip(!kategori)}>
            Semua
          </Link>
          {categories.map((item) => (
            <Link
              key={item}
              href={`/blog?kategori=${encodeURIComponent(item)}`}
              className={chip(kategori === item)}
            >
              {item}
            </Link>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h3 text-foreground">Belum terbit</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Hanya kamu dan pengurus yang melihat bagian ini.
          </p>
          <div className="mt-5 space-y-4">
            {pending.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        {published.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="Belum ada artikel terbit"
            description="Belum ada tulisan yang lolos tinjauan. Kalau kamu punya cerita, tulis yang pertama."
          />
        ) : (
          <RevealGroup className="space-y-4">
            {published.map((post) => (
              <RevealItem key={post.id}>
                <PostCard post={post} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>
    </div>
  );
}
