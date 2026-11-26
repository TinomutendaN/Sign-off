import { db } from "@/lib/db";

/** The project, only if it's in this workspace (used before handing out an upload token). */
export async function getProjectForUpload(projectId: string, orgId: string) {
  return db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } });
}

/**
 * The Milestones tab: each milestone with its tasks (for progress) and its current deliverables,
 * newest first. Older versions (replaced by "Upload new version") are left out; they stay as history.
 */
export async function getMilestoneDeliverables(projectId: string) {
  return db.milestone.findMany({
    where: { projectId },
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      name: true,
      status: true,
      dueDate: true,
      approvedAt: true,
      tasks: { select: { status: true } },
      deliverables: {
        where: { nextVersion: { is: null } },
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          title: true,
          fileName: true,
          fileUrl: true,
          status: true,
          sentById: true,
          sentAt: true,
          decisions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { kind: true, comment: true, createdAt: true },
          },
        },
      },
    },
  });
}

export type MilestoneWithDeliverables = Awaited<ReturnType<typeof getMilestoneDeliverables>>[number];
