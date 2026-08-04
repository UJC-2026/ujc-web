import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Search as SearchIcon } from "lucide-react";
import { search, KIND_LABEL, type SearchKind } from "@/lib/search/queries";
import { SearchBox } from "@/components/search/search-box";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pencarian",
  robots: { index: false },
};

type PageProps = {
  searchParams: Promise<{ q?: string; jenis?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "", jenis } = await searchParams;
  const hits = await search(q, 8);

  const counts = new Map<SearchKind, number>();
  for (const hit of hits) {
    counts.set(hit.kind, (counts.get(hit.kind) ?? 0) + 1);
  }

  const filtered = jenis ? hits.filter((h) => h.kind === jenis) : hits;

  const chip = (active: boolean) =>
    cn(
      "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="rule-gold text-h1 text-foreground">Pencarian</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Mencari di seluruh isi website — forum, artikel, marketplace, lowongan,
        kegiatan, resource, anggota, dan bisnis.
      </p>

      <div className="mt-8">
        <SearchBox initial={q} />
      </div>

      {q.trim() === "" ? (
        <div className="mt-10">
          <EmptyState
            icon={SearchIcon}
            title="Ketik sesuatu untuk mulai"
            description="Coba kata seperti “visa”, “kopdar”, “kaigo”, atau nama anggota. Tekan ⌘K / Ctrl+K dari halaman mana pun untuk membuka pencarian cepat."
          />
        </div>
      ) : hits.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={SearchX}
            title="Tidak ada yang cocok"
            description={`Tidak ada hasil untuk “${q}”. Coba kata kunci lain atau yang lebih umum.`}
          />
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label="Saring jenis hasil"
            className="mt-8 flex flex-wrap gap-1.5"
          >
            <Link
              href={`/search?q=${encodeURIComponent(q)}`}
              className={chip(!jenis)}
            >
              Semua ({hits.length})
            </Link>
            {[...counts.entries()].map(([kind, count]) => (
              <Link
                key={kind}
                href={`/search?q=${encodeURIComponent(q)}&jenis=${kind}`}
                className={chip(jenis === kind)}
              >
                {KIND_LABEL[kind]} ({count})
              </Link>
            ))}
          </div>

          <ul className="mt-7 space-y-3">
            {filtered.map((hit) => (
              <li
                key={`${hit.kind}-${hit.id}`}
                className="relative rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent"
              >
                <Badge variant="outline">{KIND_LABEL[hit.kind]}</Badge>
                <h2 className="mt-2.5 text-h3 font-medium text-foreground">
                  <Link href={hit.href}>
                    <span className="absolute inset-0" aria-hidden />
                    {hit.title}
                  </Link>
                </h2>
                {hit.snippet?.trim() && (
                  <p className="mt-2 line-clamp-2 text-body text-muted-foreground">
                    {hit.snippet.trim()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
