"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useRef, useState, useTransition, type MouseEvent } from "react";
import type { TaskStatus } from "@/generated/prisma/enums";
import { moveTask } from "../actions";
import { neighbours, placeTask, type BoardTask, type People } from "../board";
import { STATUSES, STATUS_LABEL } from "../labels";
import { BoardColumn, type ColumnItem } from "./BoardColumn";
import { TaskCardView } from "./TaskCardView";

type DropData = { type: "card" | "column"; status: TaskStatus };

/** True when the card has the same column and neighbours in both lists (nothing to re-render). */
function samePlace(a: BoardTask[], b: BoardTask[], id: string) {
  const x = neighbours(a, id);
  const y = neighbours(b, id);
  return (
    a.find((t) => t.id === id)?.status === b.find((t) => t.id === id)?.status &&
    x.prevId === y.prevId &&
    x.nextId === y.nextId
  );
}

// Prefer the card under the pointer, then the column under it. Keyboard drags have no
// pointer, so they use what the moving card overlaps, then the nearest target.
const collisions: CollisionDetection = (args) => {
  const isCard = (c: { data?: { droppableContainer?: { data: { current?: unknown } } } }) =>
    (c.data?.droppableContainer?.data.current as DropData | undefined)?.type === "card";
  for (const found of [pointerWithin(args), rectIntersection(args)]) {
    if (found.length) {
      const cards = found.filter(isCard);
      return cards.length ? cards : found;
    }
  }
  return closestCorners(args);
};

// Keyboard: ←/→ jump to the next column, ↑/↓ move past the card above or below.
const keyboardCoordinates: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  const { collisionRect, droppableRects, droppableContainers } = context;
  if (!collisionRect) return undefined;

  if (event.code === "ArrowDown" || event.code === "ArrowUp") {
    event.preventDefault();
    const step = Math.max(40, collisionRect.height * 0.6);
    return { ...currentCoordinates, y: currentCoordinates.y + (event.code === "ArrowDown" ? step : -step) };
  }

  if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
    event.preventDefault();
    const columns = droppableContainers
      .getEnabled()
      .filter((c) => (c.data.current as DropData | undefined)?.type === "column")
      .map((c) => droppableRects.get(c.id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .sort((a, b) => a.left - b.left);
    const centre = collisionRect.left + collisionRect.width / 2;
    const distance = (r: { left: number; width: number }) => Math.abs(r.left + r.width / 2 - centre);
    const here = columns.reduce((best, r, i) => (distance(r) < distance(columns[best]) ? i : best), 0);
    const target = columns[here + (event.code === "ArrowRight" ? 1 : -1)];
    if (!target) return currentCoordinates;
    return { x: currentCoordinates.x + (target.left + target.width / 2 - centre), y: currentCoordinates.y };
  }
  return undefined;
};

type KanbanBoardProps = { projectId: string; tasks: BoardTask[]; people: People };

/** The four columns. Drag with the mouse, a short press on touch screens, or Space and the arrow keys. */
export function KanbanBoard({ projectId, tasks, people }: KanbanBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [saved, setSaved] = useOptimistic(tasks);
  const [preview, setPreview] = useState<BoardTask[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [slotHeight, setSlotHeight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const draggedAt = useRef(0);

  // "+ New task" in the header links to ?add=TODO; "+ Add task" opens a column's field.
  const addParam = searchParams.get("add") as TaskStatus | null;
  const validParam = addParam && (STATUSES as readonly string[]).includes(addParam) ? addParam : null;
  const [adding, setAdding] = useState<TaskStatus | null>(validParam);
  const [seenParam, setSeenParam] = useState(validParam);
  if (validParam !== seenParam) {
    setSeenParam(validParam);
    if (validParam) setAdding(validParam);
  }
  const clearAddParam = () => {
    if (searchParams.has("add")) router.replace(pathname, { scroll: false });
  };

  const list = preview ?? saved;
  const active = activeId ? list.find((t) => t.id === activeId) : undefined;
  const source = activeId ? saved.find((t) => t.id === activeId) : undefined;

  // While dragging, the moving card shows as a slot at its new place; outside a drag, just cards.
  const itemsFor = (status: TaskStatus): ColumnItem[] =>
    list
      .filter((t) => t.status === status)
      .map((t) => (t.id === activeId ? { kind: "slot" } : { kind: "card", task: t }));
  const titleOf = (id: string | number) => list.find((t) => t.id === id)?.title ?? "the task";
  const placeOf = (id: string | number) => {
    const t = list.find((x) => x.id === id);
    if (!t) return "";
    const column = list.filter((x) => x.status === t.status);
    return `${STATUS_LABEL[t.status]}, position ${column.indexOf(t) + 1} of ${column.length}`;
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${titleOf(a.id)}. ${placeOf(a.id)}.`,
    onDragOver: ({ active: a }) => `${titleOf(a.id)} is now in ${placeOf(a.id)}.`,
    onDragEnd: ({ active: a }) => `Dropped ${titleOf(a.id)} in ${placeOf(a.id)}.`,
    onDragCancel: ({ active: a }) => `Cancelled. ${titleOf(a.id)} is back where it was.`,
  };

  function onDragStart({ active: a }: DragStartEvent) {
    setError(null);
    setActiveId(String(a.id));
    setSlotHeight(a.rect.current.initial?.height ?? 0);
    setPreview(saved);
  }

  // Runs whenever the target changes and on every move over the same card, because which
  // half of that card the dragged card is over decides whether it lands above or below.
  function updatePreview({ active: a, over }: DragOverEvent | DragMoveEvent) {
    if (!over || over.id === a.id) return;
    const data = over.data.current as DropData | undefined;
    if (!data) return;
    const id = String(a.id);

    setPreview((current) => {
      const base = current ?? saved;
      let next: BoardTask[];
      if (data.type === "column") {
        const me = base.find((t) => t.id === id);
        // Already in this column: hovering its empty space shouldn't jump the card to the end.
        if (me?.status === data.status) return base;
        next = placeTask(base, id, data.status, null, false);
      } else {
        const moving = a.rect.current.translated;
        const below = moving ? moving.top + moving.height / 2 > over.rect.top + over.rect.height / 2 : false;
        const overTask = base.find((t) => t.id === over.id);
        if (!overTask) return base;
        next = placeTask(base, id, overTask.status, String(over.id), below);
      }
      return samePlace(base, next, id) ? base : next;
    });
  }

  function reset() {
    setActiveId(null);
    setPreview(null);
  }

  function onDragEnd({ active: a, over }: DragEndEvent) {
    draggedAt.current = Date.now();
    const finalList = preview;
    reset();
    if (!over || !finalList) return;

    const id = String(a.id);
    const before = saved.find((t) => t.id === id);
    const after = finalList.find((t) => t.id === id);
    if (!before || !after) return;
    const was = neighbours(saved, id);
    const now = neighbours(finalList, id);
    if (before.status === after.status && was.prevId === now.prevId && was.nextId === now.nextId) return;

    startTransition(async () => {
      setSaved(finalList);
      const result = await moveTask({ taskId: id, status: after.status, ...now });
      if (!result.ok) setError(result.error);
    });
  }

  // A drag ends with a mouse-up on the card; don't treat that as a click that opens it.
  function onCardClick(event: MouseEvent) {
    if (Date.now() - draggedAt.current < 300) event.preventDefault();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisions}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To move a task, press Space. Use the arrow keys to move it between columns and up or down, then press Space again to drop it, or Escape to cancel.",
        },
      }}
      onDragStart={onDragStart}
      onDragOver={updatePreview}
      onDragMove={updatePreview}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
    >
      {error && (
        <p role="alert" className="m-0 rounded-control bg-red-tint px-3 py-2 text-[13px] text-red-ink">
          {error}
        </p>
      )}
      <div className="scroll-x overflow-x-auto px-0.5 pt-1 pb-3 phone:snap-x phone:snap-proximity">
        <div className="grid grid-cols-[repeat(4,minmax(260px,1fr))] items-start gap-[14px]">
          {STATUSES.map((status) => (
            <BoardColumn
              key={status}
              projectId={projectId}
              status={status}
              items={itemsFor(status)}
              source={source && source.status === status ? source : null}
              people={people}
              slotHeight={slotHeight}
              adding={adding === status}
              onAddOpen={() => {
                setAdding(status);
                clearAddParam();
              }}
              onAddClose={() => {
                setAdding(null);
                clearAddParam();
              }}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {active ? (
          <div className="flex rotate-3 cursor-grabbing flex-col gap-[10px] rounded-card bg-card p-[14px] text-ink shadow-lift">
            <TaskCardView
              task={active}
              person={active.assigneeId ? (people[active.assigneeId] ?? null) : null}
              variant="lifted"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
