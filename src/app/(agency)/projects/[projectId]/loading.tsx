import { Skeleton } from "@/components/ui/Skeleton";

// Shown under the project header and tabs while Board, List, Milestones or Activity loads.
export default function ProjectTabLoading() {
  return (
    <div role="status" aria-label="Loading" className="scroll-x overflow-x-auto px-0.5 pt-1 pb-3">
      <div className="grid grid-cols-[repeat(4,minmax(260px,1fr))] items-start gap-[14px]">
        {[3, 2, 2, 3].map((cards, i) => (
          <div key={i} className="flex flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-3">
            <Skeleton className="mx-2 my-1.5 h-4 w-24 bg-card/70" />
            {Array.from({ length: cards }, (_, j) => (
              <Skeleton key={j} className="h-[104px] rounded-card bg-card" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
