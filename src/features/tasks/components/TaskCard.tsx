"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import Link from "next/link";
import type { MouseEvent } from "react";
import { cx } from "@/components/ui/cx";
import type { BoardTask, Person } from "../board";
import { TaskCardView } from "./TaskCardView";

type TaskCardProps = {
  projectId: string;
  task: BoardTask;
  person: Person | null;
  onClick: (event: MouseEvent) => void;
};

/**
 * A draggable card that is also a drop target (dropping on it lands above or below it).
 * While it's dragged, the column shows a darker grey slot and the lifted copy follows the pointer.
 * Clicking opens the task (?task=id).
 */
export function TaskCard({ projectId, task, person, onClick }: TaskCardProps) {
  const drag = useDraggable({
    id: task.id,
    data: { type: "card" },
    attributes: { role: "link", roleDescription: "draggable task" },
  });
  const drop = useDroppable({ id: task.id, data: { type: "card", status: task.status } });

  const setRef = (node: HTMLElement | null) => {
    drag.setNodeRef(node);
    drop.setNodeRef(node);
  };

  // While it's dragged the card stays mounted but hidden (the column shows a slot instead):
  // a touch drag needs the element that was touched to stay in the page, or the page scrolls.
  const dragging = drag.isDragging;

  return (
    <Link
      ref={setRef}
      href={`/projects/${projectId}?task=${task.id}`}
      scroll={false}
      onClick={onClick}
      {...drag.attributes}
      {...drag.listeners}
      className={cx(
        "flex touch-manipulation flex-col gap-[10px] rounded-card bg-card p-[14px] text-ink shadow-card outline-none select-none [-webkit-touch-callout:none] hover:text-ink focus-visible:ring-2 focus-visible:ring-violet",
        dragging && "hidden",
      )}
    >
      <TaskCardView task={task} person={person} />
    </Link>
  );
}
