"use client";

import { useDroppable } from "@dnd-kit/core";
import type { MouseEvent } from "react";
import { cx } from "@/components/ui/cx";
import type { TaskStatus } from "@/generated/prisma/enums";
import type { BoardTask, People } from "../board";
import { STATUS_LABEL } from "../labels";
import { AddTaskInline } from "./AddTaskInline";
import { TaskCard } from "./TaskCard";

/** What a column shows: cards, and while dragging, the slot where the card will land. */
export type ColumnItem = { kind: "card"; task: BoardTask } | { kind: "slot" };

type BoardColumnProps = {
  projectId: string;
  status: TaskStatus;
  items: ColumnItem[];
  /** The card being dragged, if it started in this column: kept mounted (hidden) for touch drags. */
  source: BoardTask | null;
  people: People;
  slotHeight: number;
  adding: boolean;
  onAddOpen: () => void;
  onAddClose: () => void;
  onCardClick: (event: MouseEvent) => void;
};

/** One grey Kanban column: title and count, its cards, then "+ Add task". */
export function BoardColumn(props: BoardColumnProps) {
  const { projectId, status, items, source, people, slotHeight, adding, onAddOpen, onAddClose, onCardClick } = props;
  const personOf = (task: BoardTask) => (task.assigneeId ? (people[task.assigneeId] ?? null) : null);
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}`, data: { type: "column", status } });

  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_LABEL[status]}
      className={cx(
        "flex flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-2 phone:snap-start",
        isOver && items.length === 0 && "outline-2 outline-violet-line",
      )}
    >
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">{STATUS_LABEL[status]}</h2>
        <span className="text-xs text-muted">{items.length}</span>
      </div>
      {items.map((item) =>
        item.kind === "slot" ? (
          <div key="slot" className="rounded-card bg-slot" style={{ height: slotHeight || 120 }} />
        ) : (
          <TaskCard
            key={item.task.id}
            projectId={projectId}
            task={item.task}
            person={personOf(item.task)}
            onClick={onCardClick}
          />
        ),
      )}
      {source && (
        <TaskCard key={source.id} projectId={projectId} task={source} person={personOf(source)} onClick={onCardClick} />
      )}
      <AddTaskInline projectId={projectId} status={status} open={adding} onOpen={onAddOpen} onClose={onAddClose} />
    </section>
  );
}
