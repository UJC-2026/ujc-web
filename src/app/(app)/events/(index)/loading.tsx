import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Skeleton className="h-11 w-48" />
      <Skeleton className="mt-5 h-5 w-full max-w-xl" />

      <Skeleton className="mt-12 h-8 w-40" />
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-card border border-border bg-surface">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-5">
              <Skeleton className="h-6 w-24 rounded-pill" />
              <Skeleton className="mt-3 h-6 w-3/4" />
              <Skeleton className="mt-3 h-4 w-40" />
              <Skeleton className="mt-4 h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
