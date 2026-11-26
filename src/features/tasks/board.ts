// Board data shapes and the pure "where does the card go" logic. Safe for client components.

import type { DeliverableStatus, TaskStatus, TaskType } from "@/generated/prisma/enums";
import type { AvatarTone } from "@/components/ui/Avatar";
import type { Member } from "@/features/workspaces/queries";
import { displayName, initials } from "@/lib/format";

/** A task as the board and the list table need it (dates already worded on the server). */
export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  assigneeId: string | null;
  due: string | null;
  /** "2026-11-28", for the instant task panel (it words the date itself). */
  dueInput: string | null;
  milestone: string | null;
  comments: number;
  badge: DeliverableStatus | null;
};

export type Person = { name: string; initials: string; tone: AvatarTone };
export type People = Record<string, Person>;

/** Everything the task panel shows, worded on the server. Team-only: never sent to the client portal. */
export type TaskDetail = {
  id: string;
  projectName: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  assigneeId: string | null;
  /** The date field's "2026-11-28" (the panel words it "28 Nov 2026"). */
  due: string | null;
  milestoneId: string | null;
  files: { id: string; name: string; url: string; from: string; size: string }[];
  comments: TaskComment[];
};

export type TaskComment = { id: string; author: Person; when: string; text: string };

/** The choices the panel's small menus offer. */
export type TaskOptions = {
  team: { id: string; person: Person }[];
  milestones: { id: string; label: string }[];
  /** The signed-in person, for the comment that appears before the server confirms it. */
  me: Person;
};

export function toPeople(members: Member[]): People {
  return Object.fromEntries(
    members.map((m) => [m.id, { name: displayName(m), initials: initials(m), tone: m.tone }]),
  );
}

/**
 * Moves one task in the flat list (columns are the list filtered by status, in list order).
 * `overId` is the card it's dropped on (null = the end of the column); `below` puts it after that card.
 */
export function placeTask(
  tasks: BoardTask[],
  taskId: string,
  status: TaskStatus,
  overId: string | null,
  below: boolean,
): BoardTask[] {
  const moving = tasks.find((t) => t.id === taskId);
  if (!moving) return tasks;
  const rest = tasks.filter((t) => t.id !== taskId);
  const moved = { ...moving, status };

  let index: number;
  if (overId) {
    const at = rest.findIndex((t) => t.id === overId);
    if (at === -1) return tasks;
    index = below ? at + 1 : at;
  } else {
    // End of the column: right after its last card, or at the end of the list.
    const last = rest.findLastIndex((t) => t.status === status);
    index = last === -1 ? rest.length : last + 1;
  }
  return [...rest.slice(0, index), moved, ...rest.slice(index)];
}

/** The cards directly above and below a task in its column. */
export function neighbours(tasks: BoardTask[], taskId: string) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { prevId: null, nextId: null };
  const column = tasks.filter((t) => t.status === task.status);
  const i = column.findIndex((t) => t.id === taskId);
  return { prevId: column[i - 1]?.id ?? null, nextId: column[i + 1]?.id ?? null };
}
