"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";
import { Pill } from "@/components/ui/Pill";
import type { TaskStatus, TaskType } from "@/generated/prisma/enums";
import { fromDateInput, longDate } from "@/lib/format";
import { updateTask } from "../actions";
import type { Person, TaskDetail, TaskOptions } from "../board";
import { STATUSES, STATUS_LABEL, TYPES, TYPE_LABEL, TYPE_TONE } from "../labels";
import type { UpdateTaskInput } from "../schemas";
import { TaskDetailMenu } from "./TaskDetailMenu";
import { TaskMenuItem } from "./TaskMenuItem";

/** The selected status pill takes the status colours; the others are white and outlined. */
const STATUS_ON: Record<TaskStatus, string> = {
  TODO: "bg-soft-2 text-ink-3",
  IN_PROGRESS: "bg-blue-soft text-blue-ink",
  IN_REVIEW: "bg-amber-tint text-amber-ink",
  DONE: "bg-green-tint text-green-ink",
};

type Fields = { assigneeId: string | null; due: string | null; milestoneId: string | null; type: TaskType };
type Change = { [K in UpdateTaskInput["field"]]: Extract<UpdateTaskInput, { field: K }>["value"] };

type TaskDetailsProps = {
  task: TaskDetail;
  options: TaskOptions;
  status: TaskStatus;
  onStatus: (status: TaskStatus) => void;
};

/** Status, Assignee, Due date, Milestone and Type, as in the design, each one changeable. */
export function TaskDetails({ task, options, status, onStatus }: TaskDetailsProps) {
  const [fields, setFields] = useOptimistic<Fields>({
    assigneeId: task.assigneeId,
    due: task.due,
    milestoneId: task.milestoneId,
    type: task.type,
  });
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function save<K extends keyof Change>(field: K, value: Change[K], patch: Partial<Fields>) {
    setError(null);
    startTransition(async () => {
      setFields((f) => ({ ...f, ...patch }));
      const result = await updateTask({ taskId: task.id, field, value });
      if (!result.ok) setError(result.error);
    });
  }

  const person = (id: string | null): Person | null => options.team.find((m) => m.id === id)?.person ?? null;
  const assignee = person(fields.assigneeId);
  const milestone = options.milestones.find((m) => m.id === fields.milestoneId);
  const none = (text: string) => <span className="text-muted">{text}</span>;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-[14px] gap-y-3 text-[13px] phone:grid-cols-[88px_minmax(0,1fr)]">
        <span className="text-muted">Status</span>
        <span className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const on = s === status;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => onStatus(s)}
                className={cx(
                  "rounded-full border px-[10px] py-[5px] text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-violet",
                  on ? cx("border-transparent", STATUS_ON[s]) : "border-line-strong bg-card text-muted hover:text-ink",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            );
          })}
        </span>

        <span className="text-muted">Assignee</span>
        <TaskDetailMenu
          label="Assignee"
          value={
            assignee ? (
              <>
                <Avatar label={assignee.initials} tone={assignee.tone} size={26} />
                <span className="truncate">{assignee.name}</span>
              </>
            ) : (
              none("Unassigned")
            )
          }
        >
          {(close) => (
            <>
              {options.team.map((m) => (
                <TaskMenuItem
                  key={m.id}
                  checked={m.id === fields.assigneeId}
                  onSelect={() => {
                    close();
                    if (m.id !== fields.assigneeId) save("assignee", m.id, { assigneeId: m.id });
                  }}
                >
                  <Avatar label={m.person.initials} tone={m.person.tone} size={26} />
                  <span className="truncate">{m.person.name}</span>
                </TaskMenuItem>
              ))}
              <TaskMenuItem
                checked={fields.assigneeId === null}
                onSelect={() => {
                  close();
                  if (fields.assigneeId !== null) save("assignee", null, { assigneeId: null });
                }}
              >
                <span className="text-muted">Unassigned</span>
              </TaskMenuItem>
            </>
          )}
        </TaskDetailMenu>

        <span className="text-muted">Due date</span>
        <TaskDetailMenu label="Due date" value={fields.due ? longDate(fromDateInput(fields.due)) : none("No due date")}>
          {(close) => (
            <form
              className="flex flex-col gap-2 p-1"
              onSubmit={(e) => {
                e.preventDefault();
                const value = String(new FormData(e.currentTarget).get("due") ?? "");
                close();
                if (value && value !== fields.due) save("dueDate", value, { due: value });
              }}
            >
              <input
                type="date"
                name="due"
                required
                defaultValue={fields.due ?? ""}
                aria-label="Due date"
                className="rounded-control border border-line-strong bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-violet"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    if (fields.due !== null) save("dueDate", null, { due: null });
                  }}
                  className="rounded-lg bg-transparent px-1.5 py-1 text-xs text-muted outline-none hover:text-ink focus-visible:bg-soft"
                >
                  No due date
                </button>
                <button
                  type="submit"
                  role="menuitem"
                  className="rounded-lg bg-violet px-3 py-1.5 text-xs font-medium text-white shadow-violet outline-none focus-visible:ring-2 focus-visible:ring-violet-line"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </TaskDetailMenu>

        <span className="text-muted">Milestone</span>
        <TaskDetailMenu label="Milestone" value={milestone ? milestone.label : none("No milestone")}>
          {(close) => (
            <>
              {options.milestones.map((m) => (
                <TaskMenuItem
                  key={m.id}
                  checked={m.id === fields.milestoneId}
                  onSelect={() => {
                    close();
                    if (m.id !== fields.milestoneId) save("milestone", m.id, { milestoneId: m.id });
                  }}
                >
                  <span className="truncate">{m.label}</span>
                </TaskMenuItem>
              ))}
              <TaskMenuItem
                checked={fields.milestoneId === null}
                onSelect={() => {
                  close();
                  if (fields.milestoneId !== null) save("milestone", null, { milestoneId: null });
                }}
              >
                <span className="text-muted">No milestone</span>
              </TaskMenuItem>
            </>
          )}
        </TaskDetailMenu>

        <span className="text-muted">Type</span>
        <TaskDetailMenu
          label="Type"
          value={
            <Pill tone={TYPE_TONE[fields.type]} size="md" className="px-[9px] text-xs">
              {TYPE_LABEL[fields.type]}
            </Pill>
          }
        >
          {(close) =>
            TYPES.map((t) => (
              <TaskMenuItem
                key={t}
                checked={t === fields.type}
                onSelect={() => {
                  close();
                  if (t !== fields.type) save("type", t, { type: t });
                }}
              >
                <Pill tone={TYPE_TONE[t]} size="md" className="px-[9px] text-xs">
                  {TYPE_LABEL[t]}
                </Pill>
              </TaskMenuItem>
            ))
          }
        </TaskDetailMenu>
      </div>
      {error && (
        <p role="alert" className="m-0 text-xs text-red-ink">
          {error}
        </p>
      )}
    </div>
  );
}
