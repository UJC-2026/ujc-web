import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Search, Users } from "lucide-react";
import { getMembers, requireModerator } from "@/lib/admin/queries";
import { MemberRow } from "@/components/admin/member-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Anggota" };

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireModerator();
  // Role and verification changes are admin-only, so moderators have no
  // reason to be here. The DB guard would reject them anyway.
  if (profile.role !== "admin") redirect("/admin");

  const { q } = await searchParams;
  const members = await getMembers(q);

  return (
    <div>
      <h2 className="text-h3 text-foreground">Anggota</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Atur peran dan verifikasi keanggotaan. Setiap perubahan tercatat di
        catatan tindakan.
      </p>

      <form role="search" className="relative mt-6 max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari nama atau NIM…"
          aria-label="Cari anggota"
          className="pl-10"
        />
        <Button type="submit" className="sr-only">
          Cari
        </Button>
      </form>

      <p className="mt-5 text-caption text-muted-foreground">
        {members.length.toLocaleString("id-ID")} anggota
        {q && ` cocok dengan “${q}”`}
      </p>

      {members.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={Users}
            title="Tidak ada anggota yang cocok"
            description="Coba kata kunci lain, atau kosongkan pencarian untuk melihat semuanya."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isSelf={member.id === profile.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
