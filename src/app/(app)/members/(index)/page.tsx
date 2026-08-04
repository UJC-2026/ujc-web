import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import {
  getMemberFilters,
  getMemberStats,
  getMembers,
  isMemberSort,
  MEMBERS_PER_PAGE,
  MEMBER_SORTS,
  type MemberSort,
} from "@/lib/members/queries";
import { MemberCard } from "@/components/members/member-card";
import { MemberSearch } from "@/components/members/member-search";
import { Pagination } from "@/components/forum/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Direktori anggota",
  description:
    "Cari anggota UJC berdasarkan nama, prefektur, atau angkatan — dan temukan yang tinggal sekota denganmu.",
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    prefektur?: string;
    angkatan?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const sort: MemberSort = isMemberSort(params.sort) ? params.sort : "terbaru";
  const page = Math.max(1, Number(params.page) || 1);

  const [{ members, total }, filters, stats] = await Promise.all([
    getMembers({
      search: params.q,
      prefecture: params.prefektur,
      angkatan: params.angkatan,
      sort,
      page,
    }),
    getMemberFilters(),
    getMemberStats(),
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
    const merged = { ...params, ...next, page: undefined };
    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, String(value));
    }
    const qs = query.toString();
    return qs ? `/members?${qs}` : "/members";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-xl">
        <h1 className="rule-gold text-h1 text-foreground">Direktori anggota</h1>
        <p className="mt-5 text-body text-muted-foreground">
          {stats.total.toLocaleString("id-ID")} anggota dari{" "}
          {stats.prefectures.toLocaleString("id-ID")} prefektur. Cari yang
          tinggal sekota denganmu, atau yang seangkatan.
        </p>
      </Reveal>

      <div className="mt-9">
        <MemberSearch basePath="/members" initial={params.q ?? ""} />
      </div>

      <div
        role="group"
        aria-label="Urutkan"
        className="mt-4 flex flex-wrap gap-1.5"
      >
        {(Object.keys(MEMBER_SORTS) as MemberSort[]).map((key) => (
          <Link key={key} href={withParams({ sort: key })} className={chip(sort === key)}>
            {MEMBER_SORTS[key]}
          </Link>
        ))}
      </div>

      {filters.prefectures.length > 0 && (
        <div
          role="group"
          aria-label="Saring prefektur"
          className="mt-2 flex flex-wrap gap-1.5"
        >
          <Link href={withParams({ prefektur: undefined })} className={chip(!params.prefektur)}>
            Semua prefektur
          </Link>
          {filters.prefectures.map((item) => (
            <Link
              key={item}
              href={withParams({ prefektur: item })}
              className={chip(params.prefektur === item)}
            >
              {item}
            </Link>
          ))}
        </div>
      )}

      {filters.angkatans.length > 0 && (
        <div
          role="group"
          aria-label="Saring angkatan"
          className="mt-2 flex flex-wrap gap-1.5"
        >
          <Link href={withParams({ angkatan: undefined })} className={chip(!params.angkatan)}>
            Semua angkatan
          </Link>
          {filters.angkatans.map((item) => (
            <Link
              key={item}
              href={withParams({ angkatan: item })}
              className={chip(params.angkatan === item)}
            >
              {item}
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-caption text-muted-foreground">
        {total.toLocaleString("id-ID")} anggota cocok
        {params.q && ` dengan “${params.q}”`}
      </p>

      {members.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={params.q ? SearchX : Users}
            title={params.q ? "Tidak ada yang cocok" : "Belum ada anggota"}
            description={
              params.q
                ? `Tidak ada anggota yang cocok dengan “${params.q}”. Coba kata kunci lain.`
                : "Belum ada anggota yang menampilkan profilnya secara publik."
            }
            action={
              params.q ? (
                <Button asChild variant="outline">
                  <Link href="/members">Hapus pencarian</Link>
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <RevealGroup className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <RevealItem key={member.id}>
                <MemberCard member={member} />
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mt-10 flex justify-center">
            <Pagination
              basePath="/members"
              params={{
                q: params.q,
                prefektur: params.prefektur,
                angkatan: params.angkatan,
                sort,
              }}
              page={page}
              totalPages={Math.ceil(total / MEMBERS_PER_PAGE)}
            />
          </div>
        </>
      )}
    </div>
  );
}
