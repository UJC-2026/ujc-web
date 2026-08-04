import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Skeleton className="h-4 w-40" />

      <div className="mt-5 rounded-panel border border-border bg-surface p-6 sm:p-7">
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="mt-5 flex items-center gap-2.5">
          <Skeleton className="size-10 rounded-full" />
          <div>
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </div>
        </div>
        <div className="mt-6 space-y-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="mt-7 h-9 w-48" />
      </div>

      <Skeleton className="mt-10 h-7 w-32" />

      <div className="mt-7 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-card border border-border bg-surface p-5">
            <div className="flex gap-3">
              <Skeleton className="h-20 w-8" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="mt-2.5 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
