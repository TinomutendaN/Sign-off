/** Placeholder while the side panel's data loads (same rhythm as the real rows). */
export function SideSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-[10px] p-2">
        <span className="size-7 rounded-lg bg-soft-2" />
        <span className="flex flex-1 flex-col gap-1.5">
          <span className="h-3 w-3/4 rounded bg-soft-2" />
          <span className="h-2.5 w-1/2 rounded bg-soft" />
        </span>
      </div>
      <div className="flex flex-col gap-2 px-2">
        <span className="h-2.5 w-2/3 rounded bg-soft" />
        <span className="h-8 rounded-control bg-soft" />
        <span className="h-8 rounded-control bg-soft" />
      </div>
    </div>
  );
}
