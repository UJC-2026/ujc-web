import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { NewPostForm } from "./new-post-form";

export const metadata: Metadata = { title: "Tulis artikel" };

export default async function NewPostPage() {
  await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/blog" className="transition-colors hover:text-primary">
          Blog komunitas
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Tulis artikel</span>
      </nav>

      <h1 className="rule-gold mt-4 text-h1 text-foreground">Tulis artikel</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Tulisanmu masuk antrean tinjauan pengurus dulu, belum langsung tayang.
        Ambil waktumu — format ini memang untuk cerita yang lebih panjang.
      </p>

      <div className="mt-9">
        <NewPostForm />
      </div>
    </div>
  );
}
