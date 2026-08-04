import { Skeleton } from "@/components/ui/skeleton";

export default function PeduliLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Skeleton className="h-11 w-56" />
      <Skeleton className="mt-5 h-5 w-full max-w-2xl" />

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-card border border-border bg-surface p-5">
            <Skeleton className="size-10" />
            <Skeleton className="mt-4 h-3 w-24" />
            <Skeleton className="mt-2 h-8 w-32" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-10 h-36 w-full rounded-panel" />

      <Skeleton className="mt-14 h-8 w-44" />
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-card border border-border bg-surface p-5">
            <Skeleton className="h-6 w-28 rounded-pill" />
            <Skeleton className="mt-3 h-6 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-5 h-2.5 w-full rounded-pill" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
