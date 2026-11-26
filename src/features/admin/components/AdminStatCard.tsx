import { cx } from "@/components/ui/cx";
import type { AdminStat } from "../queries";

/** One admin "key number" card: grey label, 30 px value, a change chip and a grey note. */
export function AdminStatCard({ stat }: { stat: AdminStat }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-card bg-card p-4 shadow-card">
      <div className="text-[13px] text-muted">{stat.label}</div>
      <div className="text-[30px] font-semibold tracking-[-0.02em] text-ink">{stat.value}</div>
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        <span
          className={cx(
            "shrink-0 rounded-full px-[7px] py-0.5 font-semibold",
            stat.chip.tone === "up" ? "bg-green-tint text-green-ink" : "bg-soft-2 text-ink-3",
          )}
        >
          {stat.chip.text}
        </span>
        <span className="truncate text-muted">{stat.note}</span>
      </div>
    </div>
  );
}
