import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-5 h-56 w-full rounded-panel sm:h-72" />
      <Skeleton className="mt-6 h-6 w-24 rounded-pill" />
      <Skeleton className="mt-3 h-11 w-3/4" />

      <div className="mt-6 grid gap-4 rounded-panel border border-border bg-surface p-6 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="size-5 shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1.5 h-4 w-36" />
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="mt-10 h-40 w-full rounded-panel" />
    </div>
  );
}
