import { cn } from "@/lib/utils";

/** Kanji 絆 (kizuna, "bond") — the recurring UJC watermark. */
export function KizunaMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none select-none font-serif leading-none",
        className,
      )}
    >
      絆
    </span>
  );
}

/** Minimal torii silhouette, drawn as a thin outline for decorative use. */
export function ToriiMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      aria-hidden
      className={cn("pointer-events-none", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 10h56M10 18h44M18 18v34M46 18v34M18 26h28" />
    </svg>
  );
}

/** Nami (wave) band used along section edges. */
export function NamiPattern({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 24"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("pointer-events-none", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M0 16c15 0 15-10 30-10s15 10 30 10 15-10 30-10 15 10 30 10 15-10 30-10 15 10 30 10 15-10 30-10 15 10 30 10" />
      <path
        d="M0 22c15 0 15-10 30-10s15 10 30 10 15-10 30-10 15 10 30 10 15-10 30-10 15 10 30 10 15-10 30-10 15 10 30 10"
        opacity="0.5"
      />
    </svg>
  );
}
