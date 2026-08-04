"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BadgeCheck, BadgeX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { formatDateID } from "@/lib/format";
import {
  updateMemberRole,
  updateMemberVerification,
} from "@/app/(app)/admin/actions";
import type { AdminMember } from "@/lib/admin/queries";
import type { UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = ["member", "moderator", "admin"];

export function MemberRow({
  member,
  isSelf,
}: {
  member: AdminMember;
  isSelf: boolean;
}) {
  const [role, setRole] = useState<UserRole>(member.role);
  const [verified, setVerified] = useState(member.is_verified);
  const [busy, setBusy] = useState(false);

  async function changeRole(next: UserRole) {
    if (next === role) return;
    setBusy(true);

    const data = new FormData();
    data.set("userId", member.id);
    data.set("role", next);

    const result = await updateMemberRole({}, data);
    setBusy(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    setRole(next);
    toast.success(result.success);
  }

  async function toggleVerified() {
    setBusy(true);

    const data = new FormData();
    data.set("userId", member.id);
    data.set("verified", String(!verified));

    const result = await updateMemberVerification({}, data);
    setBusy(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    setVerified(!verified);
    toast.success(result.success);
  }

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface p-4">
      <Avatar src={member.avatar_url} name={member.full_name} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/members/${member.id}`}
            className="truncate text-body font-medium text-foreground transition-colors hover:text-primary"
          >
            {member.full_name}
          </Link>
          <RoleBadge role={role} />
          {verified && (
            <BadgeCheck className="size-4 text-accent" aria-label="Terverifikasi" />
          )}
        </div>
        <p className="mt-0.5 text-caption text-muted-foreground">
          {[member.city, member.prefecture].filter(Boolean).join(", ") ||
            "Domisili belum diisi"}
          {member.angkatan && ` · Angkatan ${member.angkatan}`}
          {` · Bergabung ${formatDateID(member.join_date)}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`role-${member.id}`}>
          Peran {member.full_name}
        </label>
        <select
          id={`role-${member.id}`}
          value={role}
          disabled={busy || isSelf}
          onChange={(event) => changeRole(event.target.value as UserRole)}
          title={isSelf ? "Kamu tidak bisa mengubah peranmu sendiri." : undefined}
          className="h-9 rounded-field border border-border bg-surface px-2.5 text-caption text-foreground transition-colors hover:border-border-strong focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ROLES.map((option) => (
            <option key={option} value={option}>
              {option === "admin"
                ? "Admin"
                : option === "moderator"
                  ? "Moderator"
                  : "Anggota"}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={toggleVerified}
          disabled={busy}
          className={cn(
            "flex items-center gap-1.5 rounded-field border px-3 py-2 text-caption font-medium transition-colors disabled:opacity-50",
            verified
              ? "border-border text-muted-foreground hover:border-danger hover:text-danger"
              : "border-border text-muted-foreground hover:border-accent hover:text-accent",
          )}
        >
          {verified ? (
            <>
              <BadgeX className="size-3.5" aria-hidden />
              Cabut
            </>
          ) : (
            <>
              <BadgeCheck className="size-3.5" aria-hidden />
              Verifikasi
            </>
          )}
        </button>
      </div>
    </li>
  );
}
