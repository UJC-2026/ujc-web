import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-11 w-64" />
      <Skeleton className="mt-5 h-5 w-full max-w-md" />

      <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-11 w-full sm:max-w-xs" />
        <Skeleton className="h-9 w-56 rounded-pill" />
      </div>

      <div className="mt-10 space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </div>
            </div>
            <Skeleton className="mt-3.5 h-6 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-4 h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
