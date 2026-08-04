import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  basePath,
  params,
  page,
  totalPages,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Show a compact window around the current page.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, Math.max(page + 2, 5));
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const arrowClass =
    "flex size-9 items-center justify-center rounded-field border border-border text-muted-foreground transition-colors hover:border-accent hover:text-primary";

  return (
    <nav aria-label="Navigasi halaman" className="flex items-center gap-1.5">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} aria-label="Halaman sebelumnya" className={arrowClass}>
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      )}

      {pages.map((target) => (
        <Link
          key={target}
          href={hrefFor(target)}
          aria-current={target === page ? "page" : undefined}
          className={cn(
            "flex size-9 items-center justify-center rounded-field text-caption font-medium transition-colors",
            target === page
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:border-accent hover:text-primary",
          )}
        >
          {target}
        </Link>
      ))}

      {page < totalPages && (
        <Link href={hrefFor(page + 1)} aria-label="Halaman berikutnya" className={arrowClass}>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
