import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { OrgMember, OrgPosition } from "@/lib/structure/queries";

const STATUS = {
  aktif: null,
  alumni: { label: "Alumni", variant: "outline" as const },
  cuti: { label: "Cuti", variant: "neutral" as const },
};

/**
 * Search results as a flat list of people, not a tree. Someone looking for
 * "Osaka" wants the four pengurus who live there side by side, not four
 * branches to expand.
 */
export function MemberHits({
  hits,
}: {
  hits: { member: OrgMember; position: OrgPosition }[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {hits.map(({ member, position }) => {
        const badge = STATUS[member.status];
        return (
          <li key={member.id}>
            <article className="relative flex h-full items-start gap-3.5 rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent">
              <Avatar src={member.photo_url} name={member.display_name} size="md" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-medium text-foreground">
                  {member.display_name}
                </p>
                <p className="mt-0.5 truncate text-caption text-primary">
                  <Link href={`/structure/${position.id}`}>
                    <span className="absolute inset-0" aria-hidden />
                    {position.name}
                  </Link>
                </p>
                {member.city && (
                  <p className="mt-0.5 truncate text-caption text-muted-foreground">
                    {member.city}
                  </p>
                )}
                {member.motto && (
                  <p className="mt-2 line-clamp-2 text-caption text-muted-foreground italic">
                    “{member.motto}”
                  </p>
                )}
              </div>

              {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
