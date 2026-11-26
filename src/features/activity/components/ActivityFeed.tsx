import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";
import type { ActivityLine } from "../queries";

/** A project's activity: grey panel, white card, one row per event (client project view style). */
export function ActivityFeed({ lines }: { lines: ActivityLine[] }) {
  return (
    <section className="flex flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px]">
      <div className="px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">Activity</h2>
      </div>
      <div className="flex flex-col rounded-card bg-card px-[14px] py-1.5 shadow-card">
        {lines.map((line, i) => (
          <div
            key={line.id}
            className={cx("flex gap-3 py-3", i < lines.length - 1 ? "border-b border-soft-2" : "border-b border-transparent")}
          >
            <Avatar label={line.avatar.label} tone={line.avatar.tone} size={28} />
            <div className="flex min-w-0 flex-col gap-[3px]">
              <div className="text-[13px] leading-[1.45] text-ink">
                <span className="font-semibold">{line.who}</span> {line.text}
              </div>
              <div className="text-[11px] text-muted">{line.when}</div>
            </div>
          </div>
        ))}
        {lines.length === 0 && <div className="py-6 text-center text-[13px] text-muted">No activity yet.</div>}
      </div>
    </section>
  );
}
