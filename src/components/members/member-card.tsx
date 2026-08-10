import Link from "next/link";
import { HandHeart, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, RoleBadge } from "@/components/ui/badge";
import type { MemberCard as MemberCardData } from "@/lib/members/queries";

export function MemberCard({ member }: { member: MemberCardData }) {
  return (
    <article className="relative flex h-full flex-col rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent">
      <div className="flex items-center gap-3">
        <Avatar src={member.avatar_url} name={member.full_name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-body font-medium text-foreground">
            <Link href={`/members/${member.id}`}>
              <span className="absolute inset-0" aria-hidden />
              {member.full_name}
            </Link>
          </h3>
          <p className="truncate text-caption text-muted-foreground">
            {[member.city, member.prefecture].filter(Boolean).join(", ") ||
              "Domisili belum diisi"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {member.role !== "member" && <RoleBadge role={member.role} />}
        {member.is_verified && (
          <Badge variant="success">
            <ShieldCheck aria-hidden />
            Terverifikasi
          </Badge>
        )}
        {member.isMentor && (
          <Badge variant="accent">
            <HandHeart aria-hidden />
            Mentor
          </Badge>
        )}
      </div>

      {member.bio && (
        <p className="mt-3 line-clamp-3 text-caption text-muted-foreground">
          {member.bio}
        </p>
      )}

      <p className="mt-auto pt-4 text-caption text-muted-foreground">
        {[member.major, member.angkatan && `Angkatan ${member.angkatan}`]
          .filter(Boolean)
          .join(" · ") || "Program studi belum diisi"}
      </p>
    </article>
  );
}


/**
 * The same member as one compact line, for the list view.
 *
 * Keeps what a scanner needs — who, where, what badges — and drops the bio
 * and the study line, which is the whole point of asking for a list: more
 * people on screen at once.
 */
export function MemberRow({ member }: { member: MemberCardData }) {
  return (
    <article className="relative flex items-center gap-3.5 rounded-card border border-border bg-surface px-4 py-3 transition-colors duration-200 hover:border-accent">
      <Avatar src={member.avatar_url} name={member.full_name} size="sm" />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-body font-medium text-foreground">
          <Link href={`/members/${member.id}`}>
            <span className="absolute inset-0" aria-hidden />
            {member.full_name}
          </Link>
        </h3>
        <p className="truncate text-caption text-muted-foreground">
          {[
            [member.city, member.prefecture].filter(Boolean).join(", "),
            member.angkatan && `Angkatan ${member.angkatan}`,
          ]
            .filter(Boolean)
            .join(" · ") || "Domisili belum diisi"}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {member.role !== "member" && <RoleBadge role={member.role} />}
        {member.is_verified && (
          <Badge variant="success">
            <ShieldCheck aria-hidden />
            <span className="sr-only sm:not-sr-only">Terverifikasi</span>
          </Badge>
        )}
        {member.isMentor && (
          <Badge variant="accent">
            <HandHeart aria-hidden />
            <span className="sr-only sm:not-sr-only">Mentor</span>
          </Badge>
        )}
      </div>
    </article>
  );
}
