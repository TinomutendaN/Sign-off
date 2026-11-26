import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";
import type { ActivityLine } from "../queries";

type ActivityFeedProps = {
  lines: ActivityLine[];
  /** "Activity" on project pages, "Latest updates" on Client home. */
  title?: string;
  /** Client home's tighter rows with 26 px avatars. */
  compact?: boolean;
  className?: string;
};

/** A project's activity: grey panel, white card, one row per event (client project view style). */
export function ActivityFeed({ lines, title = "Activity", compact = false, className }: ActivityFeedProps) {
  return (
    <section className={cx("flex flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px]", className)}>
      <div className="px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">{title}</h2>
      </div>
      <div className={cx("flex flex-col rounded-card bg-card px-[14px] shadow-card", compact ? "py-1" : "py-1.5")}>
        {lines.map((line, i) => (
          <div
            key={line.id}
            className={cx(
              "flex",
              compact ? "gap-[10px] py-[11px]" : "gap-3 py-3",
              i < lines.length - 1 ? "border-b border-soft-2" : "border-b border-transparent",
            )}
          >
            <Avatar label={line.avatar.label} tone={line.avatar.tone} size={compact ? 26 : 28} />
            <div className={cx("flex min-w-0 flex-col", compact ? "gap-0.5" : "gap-[3px]")}>
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
