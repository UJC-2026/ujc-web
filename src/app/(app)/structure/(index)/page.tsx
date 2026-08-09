import type { Metadata } from "next";
import Link from "next/link";
import { Network, SearchX } from "lucide-react";
import {
  divisionOptions,
  getPeriods,
  getStructure,
  scopeToDivision,
  searchMembers,
} from "@/lib/structure/queries";
import { OrgTree } from "@/components/structure/org-tree";
import { MemberHits } from "@/components/structure/member-hits";
import { MemberSearch } from "@/components/members/member-search";
import { Button } from "@/components/ui/button";
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
  searchParams: Promise<{ period?: string; q?: string; divisi?: string }>;
}) {
  const params = await searchParams;
  const { period, divisi } = params;
  const q = params.q?.trim() ?? "";

  const periods = await getPeriods();

  // Default to the active period, falling back to the newest on record.
  const selected =
    periods.find((item) => item.year_label === period) ??
    periods.find((item) => item.is_active) ??
    periods[0];

  const tree = selected ? await getStructure(selected.id) : [];

  // Both the chips and the search box read from the same scoped tree, so
  // searching inside a division stays inside it.
  const scoped = scopeToDivision(tree, divisi);
  const hits = q ? searchMembers(scoped, q) : [];

  const withParams = (next: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...next })) {
      if (value) query.set(key, String(value));
    }
    const qs = query.toString();
    return qs ? `/structure?${qs}` : "/structure";
  };

  const chip = (active: boolean) =>
    cn(
      "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
    );

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
              // Position ids belong to one period, so carrying the divisi
              // filter across would scope to an id the new period never had.
              href={withParams({
                period: item.year_label,
                divisi: undefined,
              })}
              className={chip(selected?.id === item.id)}
            >
              {item.year_label}
              {item.is_active && " · aktif"}
            </Link>
          ))}
        </div>
      )}

      {tree.length > 0 && (
        <>
          <div className="mt-4">
            <MemberSearch
              basePath="/structure"
              initial={q}
              placeholder="Cari nama, divisi, atau kota…"
              label="Cari pengurus"
            />
          </div>

          <div
            role="group"
            aria-label="Saring divisi"
            className="mt-4 flex flex-wrap gap-1.5"
          >
            <Link href={withParams({ divisi: undefined })} className={chip(!divisi)}>
              Semua divisi
            </Link>
            {divisionOptions(tree).map((node) => (
              <Link
                key={node.id}
                href={withParams({ divisi: node.id })}
                className={chip(divisi === node.id)}
              >
                {node.name}
              </Link>
            ))}
          </div>
        </>
      )}

      {tree.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Network}
            title="Struktur belum disusun"
            description="Admin belum mengisi susunan kepengurusan untuk periode ini."
          />
        </div>
      ) : q ? (
        <div className="mt-8">
          <p className="text-caption text-muted-foreground">
            {hits.length} pengurus cocok dengan “{q}”
          </p>

          {hits.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={SearchX}
                title="Tidak ada yang cocok"
                description={`Tidak ada pengurus yang cocok dengan “${q}”. Coba nama, divisi, atau kota lain.`}
                action={
                  <Button asChild variant="outline">
                    <Link href={withParams({ q: undefined })}>
                      Hapus pencarian
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="mt-6">
              <MemberHits hits={hits} />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <OrgTree nodes={scoped} />
        </div>
      )}
    </div>
  );
}
