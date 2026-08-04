import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sedang offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-pill border border-accent/40 bg-surface text-accent">
        <WifiOff className="size-7" aria-hidden />
      </span>

      <h1 className="mt-7 text-h2 text-foreground">Sambungan sedang putus</h1>
      <p className="mt-4 text-body text-muted-foreground">
        Halaman ini belum pernah kamu buka, jadi belum tersimpan di HP-mu.
        Halaman yang sudah pernah dibuka tetap bisa dibaca walau tanpa sinyal.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Ke beranda</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/forum">Buka forum</Link>
        </Button>
      </div>
    </div>
  );
}
