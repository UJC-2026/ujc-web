import type { Metadata } from "next";
import Link from "next/link";
import { Network } from "lucide-react";
import { getPeriods, getStructure } from "@/lib/structure/queries";
import { OrgTree } from "@/components/structure/org-tree";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Struktur organisasi",
  description:
    "Susunan kepengurusan UNSIA Japan Community beserta arsip periode sebelumnya.",
};

export default async function StructurePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const periods = await getPeriods();

  // Default to the active period, falling back to the newest on record.
  const selected =
    periods.find((item) => item.year_label === period) ??
    periods.find((item) => item.is_active) ??
    periods[0];

  const tree = selected ? await getStructure(selected.id) : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">Struktur organisasi</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Siapa mengerjakan apa di UJC. Klik satu jabatan untuk melihat anggota
          dan tugasnya lebih rinci.
        </p>
      </Reveal>

      {periods.length > 1 && (
        <div
          role="group"
          aria-label="Pilih periode kepengurusan"
          className="mt-9 flex flex-wrap gap-1.5"
        >
          {periods.map((item) => (
            <Link
              key={item.id}
              href={`/structure?period=${encodeURIComponent(item.year_label)}`}
              className={cn(
                "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
                selected?.id === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
              )}
            >
              {item.year_label}
              {item.is_active && " · aktif"}
            </Link>
          ))}
        </div>
      )}

      {tree.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Network}
            title="Struktur belum disusun"
            description="Admin belum mengisi susunan kepengurusan untuk periode ini."
          />
        </div>
      ) : (
        <div className="mt-10">
          <OrgTree nodes={tree} />
        </div>
      )}
    </div>
  );
}
