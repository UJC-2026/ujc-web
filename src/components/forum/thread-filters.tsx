"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { THREAD_SORTS, type ThreadSort } from "@/lib/forum/types";
import { cn } from "@/lib/utils";

export function ThreadFilters({
  basePath,
  sort,
  search,
}: {
  basePath: string;
  sort: ThreadSort;
  search: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(search);

  const buildUrl = (next: Record<string, string | null>) => {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    // any filter change invalidates the current page offset
    query.delete("page");
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(buildUrl({ q: term.trim() || null }));
        }}
        className="relative w-full sm:max-w-xs"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Cari diskusi…"
          aria-label="Cari diskusi"
          className="pl-10"
        />
        <Button type="submit" className="sr-only">
          Cari
        </Button>
      </form>

      <div
        role="group"
        aria-label="Urutkan diskusi"
        className="flex flex-wrap items-center gap-1"
      >
        {(Object.keys(THREAD_SORTS) as ThreadSort[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={sort === key}
            onClick={() => router.push(buildUrl({ sort: key }))}
            className={cn(
              "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
              sort === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
            )}
          >
            {THREAD_SORTS[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
