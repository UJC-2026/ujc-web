import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-border bg-surface-muted/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-pill border border-accent/40 bg-surface text-accent">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-h3 font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-body text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
