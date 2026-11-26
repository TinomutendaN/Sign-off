import { Avatar, type AvatarTone } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";

type DueRowProps = {
  title: string;
  /** "Thu 26 Nov · In progress" */
  when: string;
  /** Tag colour class for the task type, e.g. "bg-amber". */
  tag: string;
  assignee: { name: string; initials: string; tone: AvatarTone } | null;
  last: boolean;
};

/** One task due in the next seven days: type colour bar, title, day and status, assignee. */
export function DueRow({ title, when, tag, assignee, last }: DueRowProps) {
  return (
    <div className={cx("flex items-center gap-[10px] py-[11px]", last ? "border-b border-transparent" : "border-b border-soft-2")}>
      <span className={cx("h-[26px] w-1 shrink-0 rounded-[2px]", tag)} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-medium text-ink">{title}</span>
        <span className="text-[11px] text-muted">{when}</span>
      </span>
      {assignee ? (
        <span title={assignee.name}>
          <Avatar label={assignee.initials} tone={assignee.tone} size={26} />
        </span>
      ) : (
        <span title="Unassigned">
          <Avatar label="?" tone="grey" size={26} />
        </span>
      )}
    </div>
  );
}
