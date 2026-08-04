import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ResourcesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Skeleton className="h-11 w-48" />
      <Skeleton className="mt-5 h-5 w-full max-w-xl" />

      <div className="mt-9 flex flex-wrap gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-pill" />
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
