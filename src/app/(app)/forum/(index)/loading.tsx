import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

/**
 * Scoped to the (index) group on purpose: a loading.tsx directly under /forum
 * would also wrap /forum/[category], streaming its response and turning its
 * notFound() into a soft 404.
 */
export default function ForumLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Skeleton className="h-11 w-40" />
      <Skeleton className="mt-5 h-5 w-full max-w-xl" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
