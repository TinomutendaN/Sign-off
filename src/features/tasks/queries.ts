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

/**
 * One task for the task panel, only if it's on this project in this workspace (otherwise null,
 * so a stale or foreign ?task= link just doesn't open). Comments are team only, oldest first.
 */
export async function getTaskDetail(taskId: string, projectId: string, orgId: string) {
  return db.task.findFirst({
    where: { id: taskId, projectId, project: { orgId } },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      assigneeId: true,
      dueDate: true,
      milestoneId: true,
      files: {
        orderBy: { createdAt: "asc" },
        select: { id: true, fileName: true, fileUrl: true, size: true, addedById: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        select: { id: true, authorId: true, text: true, createdAt: true },
      },
    },
  });
}
