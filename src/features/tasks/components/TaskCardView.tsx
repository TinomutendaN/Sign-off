import { CalendarIcon, CommentIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";
import { Pill } from "@/components/ui/Pill";
import type { BoardTask, Person } from "../board";
import { BADGE, TYPE_LABEL, TYPE_TAG } from "../labels";

type TaskCardViewProps = {
  task: BoardTask;
  person: Person | null;
  /** "lifted" is the card while it's being dragged: type label and comment count only. */
  variant?: "card" | "lifted";
};

/** A task card's inside: tag bar, title, description, badge, comments, due date and assignee. */
export function TaskCardView({ task, person, variant = "card" }: TaskCardViewProps) {
  const badge = task.badge ? BADGE[task.badge] : null;
  const avatar = person && (
    <span title={person.name} className="flex">
      <Avatar label={person.initials} tone={person.tone} size={26} />
    </span>
  );

  return (
    <>
      <span className={cx("h-1 w-[30px] rounded-[2px]", TYPE_TAG[task.type])} />
      <div className="text-sm leading-[1.35] font-medium text-ink">{task.title}</div>

      {variant === "lifted" ? (
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{TYPE_LABEL[task.type]}</span>
          <span>
            {task.comments} {task.comments === 1 ? "comment" : "comments"}
          </span>
          <span className="flex-1" />
          {avatar}
        </div>
      ) : (
        <>
          {task.description && <div className="line-clamp-3 text-[13px] leading-normal text-muted">{task.description}</div>}
          {badge && (
            <Pill tone={badge.tone} size="md" className="self-start">
              {badge.label}
            </Pill>
          )}
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1" title={`${task.comments} comments`}>
              <CommentIcon />
              {task.comments}
            </span>
            {task.due && (
              <span className="flex items-center gap-1" title={`Due ${task.due}`}>
                <CalendarIcon />
                {task.due}
              </span>
            )}
            <span className="flex-1" />
            {avatar}
          </div>
        </>
      )}
    </>
  );
}
