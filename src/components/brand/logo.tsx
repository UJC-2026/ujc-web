import { cn } from "@/lib/utils";

/** UJC logogram: a minimal torii gate whose crossbeams form the "U", with a gold knot (kizuna) at the join. */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
        role="img"
        aria-label="Logo UNSIA Japan Community"
      >
        <rect
          width="32"
          height="32"
          rx="9"
          className="fill-primary"
        />
        <path
          d="M7 11h18M8.5 15h15"
          stroke="currentColor"
          className="text-primary-foreground"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M11.5 15v5.5a4.5 4.5 0 0 0 9 0V15"
          stroke="currentColor"
          className="text-primary-foreground"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="16" cy="15" r="1.9" className="fill-accent" />
      </svg>
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
