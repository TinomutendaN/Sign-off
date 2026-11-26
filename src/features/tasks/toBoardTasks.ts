import { shortDate, toDateInput } from "@/lib/format";
import type { BoardTask } from "./board";
import type { getProjectTasks } from "./queries";

/** Server rows → the plain shapes the board and list send to the browser. */
export function toBoardTasks(rows: Awaited<ReturnType<typeof getProjectTasks>>): BoardTask[] {
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: t.type,
    status: t.status,
    assigneeId: t.assigneeId,
    due: t.dueDate ? shortDate(t.dueDate) : null,
    dueInput: t.dueDate ? toDateInput(t.dueDate) : null,
    milestone: t.milestone ? `${t.milestone.number}. ${t.milestone.name}` : null,
    comments: t._count.comments,
    badge: t.deliverable?.status ?? null,
  }));
}
