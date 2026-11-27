import { Skeleton } from "@/components/ui/Skeleton";

// Shown in place of the project header, milestone strip and tabs while they stream in.
export function ProjectHeaderSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-[18px]">
      <div className="flex items-center gap-[14px]">
        <Skeleton className="size-11 rounded-card" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[66px] flex-[1_1_220px] rounded-side" />
        ))}
      </div>
      <Skeleton className="h-9 w-full max-w-[420px]" />
    </div>
  );
}
