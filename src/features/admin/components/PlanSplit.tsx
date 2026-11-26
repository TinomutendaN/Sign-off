import type { PlanSplitRow } from "../queries";

/** "Subscribers by plan": four violet bars with counts and monthly revenue, then free workspaces. */
export function PlanSplit({ plans, free }: { plans: PlanSplitRow[]; free: number }) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-card bg-card p-4 shadow-card">
      {plans.map((p) => (
        <div key={p.name} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="font-medium text-ink">{p.name}</span>
            <span className="whitespace-nowrap">
              <span className="font-semibold text-ink">{p.count}</span>
              <span className="text-muted"> · {p.mrr}/mo</span>
            </span>
          </div>
          <div className="h-2 rounded-[4px] bg-soft-2">
            <div className="h-2 rounded-[4px] bg-violet" style={{ width: `${p.pct}%` }} />
          </div>
        </div>
      ))}
      <div className="mt-auto flex justify-between border-t border-soft-2 pt-3 text-[13px]">
        <span className="text-muted">Free workspaces</span>
        <span className="font-semibold text-ink">{free.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
