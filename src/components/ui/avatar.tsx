"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-caption",
  md: "size-10 text-caption",
  lg: "size-14 text-base",
  xl: "size-24 text-h3",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  online = false,
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  online?: boolean;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <AvatarPrimitive.Root
        className={cn(
          "inline-flex overflow-hidden rounded-pill border border-border bg-surface-muted",
          SIZES[size],
        )}
      >
        <AvatarPrimitive.Image
          src={src ?? undefined}
          alt={name}
          className="size-full object-cover"
        />
        <AvatarPrimitive.Fallback className="flex size-full items-center justify-center font-semibold text-primary">
          {initials || "?"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {online && (
        <span
          className="absolute right-0 bottom-0 size-3 rounded-pill border-2 border-surface bg-success"
          aria-label="Sedang online"
        />
      )}
    </span>
  );
}
