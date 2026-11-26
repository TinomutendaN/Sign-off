import { cx } from "@/components/ui/cx";

export type StatTone = "violet" | "amber" | "red" | "blue";

const dots: Record<StatTone, string> = {
  violet: "bg-violet",
  amber: "bg-amber",
  red: "bg-red",
  blue: "bg-blue",
};

type StatCardProps = { label: string; value: number; note: string; tone: StatTone };

/** One white "at a glance" card: coloured dot and label, big number, grey note. */
export function StatCard({ label, value, note, tone }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-card bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span className={cx("size-2 shrink-0 rounded-[3px]", dots[tone])} />
        {label}
      </div>
      <div className="text-[30px] font-semibold tracking-[-0.02em] text-ink">{value}</div>
      <div className="truncate text-xs text-muted">{note}</div>
    </div>
  );
}
