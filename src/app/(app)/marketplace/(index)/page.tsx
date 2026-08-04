import type { Metadata } from "next";
import Link from "next/link";
import { PackagePlus, ShoppingBag } from "lucide-react";
import { getMarketCategories, getMarketItems } from "@/lib/marketplace/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { ItemCard } from "@/components/marketplace/item-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Jual, beli, dan lelang barang bekas antar anggota UJC di Jepang — termasuk barang gratis sebelum pulang ke Indonesia.",
};

type PageProps = {
  searchParams: Promise<{ kategori?: string; filter?: string }>;
};

export default async function MarketplacePage({ searchParams }: PageProps) {
  const { kategori, filter } = await searchParams;

  const [items, categories, user] = await Promise.all([
    getMarketItems({
      category: kategori,
      onlyGiveaway: filter === "gratis",
      onlyAuction: filter === "lelang",
    }),
    getMarketCategories(),
    getCurrentUser(),
  ]);

  const chip = (active: boolean) =>
    cn(
      "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
    );

  const withParams = (next: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    const merged = { kategori, filter, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `/marketplace?${qs}` : "/marketplace";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="rule-gold text-h1 text-foreground">Marketplace</h1>
          <p className="mt-5 text-body text-muted-foreground">
            Jual, beli, atau lelang barang bekas antar anggota. Cocok buat
            melepas barang sebelum pulang ke Indonesia — atau melengkapi kamar
            baru tanpa menguras tabungan.
          </p>
        </div>
        <Button asChild>
          <Link href={user ? "/marketplace/new" : "/login?next=/marketplace/new"}>
            <PackagePlus aria-hidden />
            Jual barang
          </Link>
        </Button>
      </Reveal>

      <div
        role="group"
        aria-label="Saring barang"
        className="mt-9 flex flex-wrap gap-1.5"
      >
        <Link href={withParams({ filter: undefined })} className={chip(!filter)}>
          Semua
        </Link>
        <Link
          href={withParams({ filter: "lelang" })}
          className={chip(filter === "lelang")}
        >
          Lelang
        </Link>
        <Link
          href={withParams({ filter: "gratis" })}
          className={chip(filter === "gratis")}
        >
          Gratis
        </Link>
      </div>

      {categories.length > 0 && (
        <div
          role="group"
          aria-label="Saring kategori"
          className="mt-2 flex flex-wrap gap-1.5"
        >
          <Link
            href={withParams({ kategori: undefined })}
            className={chip(!kategori)}
          >
            Semua kategori
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={withParams({ kategori: category })}
              className={chip(kategori === category)}
            >
              {category}
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={ShoppingBag}
            title="Belum ada barang di sini"
            description="Belum ada yang cocok dengan saringan ini. Coba saringan lain, atau jadi yang pertama memasang barang."
            action={
              <Button asChild>
                <Link
                  href={user ? "/marketplace/new" : "/login?next=/marketplace/new"}
                >
                  Pasang barang
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <RevealItem key={item.id}>
              <ItemCard item={item} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}
