import { db } from "@/lib/db";

/** Every task on a project, in board order, with what the cards and the list table show. */
export async function getProjectTasks(projectId: string) {
  return db.task.findMany({
    where: { projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      order: true,
      assigneeId: true,
      dueDate: true,
      milestone: { select: { number: true, name: true } },
      deliverable: { select: { status: true } },
      _count: { select: { comments: true } },
    },
  });
}
