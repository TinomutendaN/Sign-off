import { Skeleton } from "@/components/ui/Skeleton";

// Shown straight away while a signed-in page streams in, so a click never looks frozen.
// Each page wraps its content in <Suspense fallback={<PageSkeleton />}>.
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-[18px]">
      <div className="flex items-center gap-[14px]">
        <Skeleton className="size-11 rounded-card" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-[560px]" />
      <div className="flex flex-col gap-[10px] rounded-column bg-panel p-[10px]">
        <Skeleton className="h-[74px] rounded-card bg-card" />
        <Skeleton className="h-[74px] rounded-card bg-card" />
      </div>
    </div>
  );
}
