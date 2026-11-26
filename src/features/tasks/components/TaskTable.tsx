"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";
import { Pill } from "@/components/ui/Pill";
import { Tabs } from "@/components/ui/Tabs";
import type { TaskStatus } from "@/generated/prisma/enums";
import type { BoardTask, People } from "../board";
import { STATUSES, STATUS_LABEL, STATUS_TONE, TYPE_LABEL, TYPE_TAG } from "../labels";

const ANY = "any";
const NOBODY = "nobody";

type TaskTableProps = { projectId: string; tasks: BoardTask[]; people: People };

/** The List tab: the project's tasks as a table (Subscribers table style), with status and assignee filters. */
export function TaskTable({ projectId, tasks, people }: TaskTableProps) {
  const [status, setStatus] = useState<TaskStatus | typeof ANY>(ANY);
  const [assignee, setAssignee] = useState<string>(ANY);

  const assigneeIds = [...new Set(tasks.map((t) => t.assigneeId ?? NOBODY))].sort((a, b) =>
    (people[a]?.name ?? "~").localeCompare(people[b]?.name ?? "~"),
  );
  // Board order: column by column (To do first), then each card's place in its column.
  const rows = STATUSES.flatMap((s) => tasks.filter((t) => t.status === s)).filter(
    (t) => (status === ANY || t.status === status) && (assignee === ANY || (t.assigneeId ?? NOBODY) === assignee),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          variant="switch"
          label="Status"
          className="max-w-full overflow-x-auto"
          onSelect={(key) => setStatus(key as TaskStatus | typeof ANY)}
          items={[
            { key: ANY, label: "Any status", count: tasks.length, selected: status === ANY },
            ...STATUSES.map((s) => ({
              key: s,
              label: STATUS_LABEL[s],
              count: tasks.filter((t) => t.status === s).length,
              selected: status === s,
            })),
          ]}
        />
        <Tabs
          variant="switch"
          label="Assignee"
          className="max-w-full overflow-x-auto"
          onSelect={setAssignee}
          items={[
            { key: ANY, label: "Anyone", count: tasks.length, selected: assignee === ANY },
            ...assigneeIds.map((id) => ({
              key: id,
              label: people[id]?.name ?? "Unassigned",
              count: tasks.filter((t) => (t.assigneeId ?? NOBODY) === id).length,
              selected: assignee === id,
            })),
          ]}
        />
        <span className="flex-1" />
        <span className="text-xs text-muted">Counts are for all of this project&apos;s tasks.</span>
      </div>

      <section className="flex flex-col gap-[10px] rounded-column bg-panel p-[10px]">
        <div className="overflow-x-auto rounded-card bg-card px-4 py-1 shadow-card">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-xs text-muted">
                {["Task", "Type", "Status", "Assignee", "Milestone", "Due", "Comments"].map((h) => (
                  <th key={h} className={cx("px-2 py-3 font-medium", h === "Comments" && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const person = t.assigneeId ? people[t.assigneeId] : null;
                return (
                  <tr key={t.id} className="border-t border-soft-2">
                    <td className="px-2 py-3">
                      <Link
                        href={`/projects/${projectId}?task=${t.id}`}
                        scroll={false}
                        className="flex items-center gap-[10px] font-medium text-ink hover:text-violet-ink"
                      >
                        <span className={cx("h-1 w-[18px] shrink-0 rounded-[2px]", TYPE_TAG[t.type])} />
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-ink-2">{TYPE_LABEL[t.type]}</td>
                    <td className="px-2 py-3">
                      <Pill tone={STATUS_TONE[t.status]} className="gap-1.5 text-xs">
                        <span className="size-1.5 rounded-full bg-current" />
                        {STATUS_LABEL[t.status]}
                      </Pill>
                    </td>
                    <td className="px-2 py-3">
                      {person ? (
                        <span className="flex items-center gap-2 text-ink-2">
                          <Avatar label={person.initials} tone={person.tone} size={26} />
                          {person.name}
                        </span>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-ink-2">{t.milestone ?? "None"}</td>
                    <td className="px-2 py-3 text-ink-2">{t.due ?? "No date"}</td>
                    <td className="px-2 py-3 text-right font-semibold">{t.comments}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="p-6 text-center text-[13px] text-muted">No tasks match these filters.</div>
          )}
        </div>
        <div className="px-2 py-1 text-xs text-muted">
          Showing {rows.length} of {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </div>
      </section>
    </>
  );
}
