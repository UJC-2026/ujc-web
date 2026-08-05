import {
  Award,
  CalendarCheck,
  FileText,
  HeartHandshake,
  HelpingHand,
  Library,
  MessageCircle,
  MessagesSquare,
  Palette,
  PenLine,
  Repeat,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { BadgeTier, EarnedBadge } from "@/lib/badges/queries";
import { cn } from "@/lib/utils";

/**
 * Explicit allowlist rather than a dynamic lookup on the lucide barrel: the
 * icon name comes from a database column, and importing by that string would
 * both defeat tree-shaking and let a bad catalogue row break the render.
 */
const ICONS: Record<string, LucideIcon> = {
  MessageCircle,
  MessagesSquare,
  HelpingHand,
  PenLine,
  Repeat,
  Sparkles,
  FileText,
  Library,
  CalendarCheck,
  Users,
  HeartHandshake,
  Palette,
  Trophy,
};

const TIER_STYLE: Record<BadgeTier, string> = {
  perunggu: "border-border bg-surface-muted text-muted-foreground",
  perak: "border-primary/30 bg-primary/8 text-primary",
  emas: "border-accent/50 bg-accent-muted/50 text-accent-foreground",
};

const TIER_LABEL: Record<BadgeTier, string> = {
  perunggu: "Perunggu",
  perak: "Perak",
  emas: "Emas",
};

export function BadgeGrid({
  badges,
  className,
}: {
  badges: EarnedBadge[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {badges.map((badge) => {
        const Icon = ICONS[badge.icon] ?? Award;
        return (
          <li
            key={badge.slug}
            className={cn(
              "flex items-start gap-3 rounded-card border p-4",
              TIER_STYLE[badge.tier],
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-body font-medium text-foreground">
                {badge.name}
              </p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                {badge.description}
              </p>
              <p className="mt-1.5 text-caption font-medium">
                {TIER_LABEL[badge.tier]}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
