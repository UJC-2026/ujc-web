import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/forum/queries";
import { requireProfile } from "@/lib/auth/session";
import { NewThreadForm } from "./new-thread-form";

export const metadata: Metadata = {
  title: "Buat thread baru",
};

export default async function NewThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireProfile();

  const [{ category: preselected }, categories] = await Promise.all([
    searchParams,
    getCategories(),
  ]);

  const defaultCategoryId =
    categories.find((category) => category.slug === preselected)?.id ??
    categories[0]?.id ??
    "";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/forum" className="transition-colors hover:text-primary">
          Forum
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Thread baru</span>
      </nav>

      <h1 className="rule-gold mt-4 text-h1 text-foreground">Buat thread baru</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Tulis pertanyaan atau ceritamu sejelas mungkin supaya anggota lain lebih
        mudah membantu.
      </p>

      <div className="mt-9">
        <NewThreadForm
          categories={categories}
          defaultCategoryId={defaultCategoryId}
        />
      </div>
    </div>
  );
}
