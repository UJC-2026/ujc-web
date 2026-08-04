import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { OrgPosition } from "@/lib/structure/queries";

const STATUS = {
  aktif: null,
  alumni: { label: "Alumni", variant: "outline" as const },
  cuti: { label: "Cuti", variant: "neutral" as const },
};

function PositionCard({ position }: { position: OrgPosition }) {
  return (
    <article className="relative rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-h3 font-medium text-foreground">
          <Link href={`/structure/${position.id}`}>
            <span className="absolute inset-0" aria-hidden />
            {position.name}
          </Link>
        </h3>
        <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Users className="size-3.5" aria-hidden />
          {position.totalMembers}
        </span>
      </div>

      {position.description && (
        <p className="mt-2 line-clamp-2 text-caption text-muted-foreground">
          {position.description}
        </p>
      )}

      {position.members.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {position.members.map((member) => {
            const badge = STATUS[member.status];
            return (
              <li key={member.id} className="flex items-center gap-2.5">
                <Avatar src={member.photo_url} name={member.display_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-caption font-medium text-foreground">
                    {member.display_name}
                  </p>
                  {member.city && (
                    <p className="truncate text-caption text-muted-foreground">
                      {member.city}
                    </p>
                  )}
                </div>
                {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

/**
 * Renders the hierarchy as nested lists rather than a canvas chart: it stays
 * readable on a phone, works without JS, and is navigable by screen reader —
 * which matters more here than pan-and-zoom.
 */
export function OrgTree({ nodes, depth = 0 }: { nodes: OrgPosition[]; depth?: number }) {
  if (nodes.length === 0) return null;

  return (
    <ul
      className={
        depth === 0
          ? "space-y-6"
          : "mt-5 space-y-5 border-l-2 border-border pl-5 sm:pl-7"
      }
    >
      {nodes.map((node) => (
        <li key={node.id}>
          <PositionCard position={node} />
          <OrgTree nodes={node.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}
