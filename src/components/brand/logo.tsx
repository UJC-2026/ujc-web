import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The official UJC badge: a circular seal with Mount Fuji and the UNSIA
 * chevron emblem, ringed by "UNSIA · JAPAN COMMUNITY". Redrawn as SVG from
 * the organisation's ID-card artwork so it stays crisp from favicon to app
 * icon.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo-ujc.svg"
        alt="Logo UNSIA Japan Community"
        width={36}
        height={36}
        priority
        className="size-9 shrink-0"
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-foreground">
            UJC
          </span>
          <span className="text-[0.625rem] font-medium tracking-wide text-muted-foreground">
            UNSIA Japan Community
          </span>
        </span>
      )}
    </span>
  );
}
