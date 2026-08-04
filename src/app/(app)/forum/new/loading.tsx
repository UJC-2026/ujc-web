import { Skeleton } from "@/components/ui/skeleton";

export default function NewThreadLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-4 h-11 w-72" />
      <Skeleton className="mt-5 h-5 w-full max-w-lg" />

      <div className="mt-9 space-y-6">
        <div>
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="mt-1.5 h-11 w-full" />
        </div>
        <div>
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="mt-1.5 h-11 w-full" />
        </div>
        <div>
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="mt-1.5 h-56 w-full rounded-card" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>
    </div>
  );
}
