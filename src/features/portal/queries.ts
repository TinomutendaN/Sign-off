// Reads for the client portal. Client-safe by construction:
// - only projects shared with this person (a ClientAccess row) that are still active
// - only task statuses (for progress), never task titles, descriptions or comments
// - only activity marked visibleToClient
// - only current deliverables (older versions replaced by "Upload new version" are history)

import type { Prisma } from "@/generated/prisma/client";
import { getMemberDirectory, getWorkspaceSummary, type Member } from "@/features/workspaces/queries";
import { db } from "@/lib/db";

const projectSelect = {
  id: true,
  orgId: true,
  name: true,
  colour: true,
  dueDate: true,
  client: { select: { name: true } },
  milestones: {
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      name: true,
      status: true,
      tasks: { select: { status: true } },
      deliverables: {
        where: { nextVersion: { is: null } },
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          title: true,
          fileName: true,
          fileUrl: true,
          previewUrl: true,
          size: true,
          note: true,
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
  },
} satisfies Prisma.ProjectSelect;

const activitySelect = {
  id: true,
  projectId: true,
  actorId: true,
  actorKind: true,
  type: true,
  subject: true,
  detail: true,
  createdAt: true,
} satisfies Prisma.ActivitySelect;

export type PortalProject = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;
export type PortalMilestone = PortalProject["milestones"][number];
export type PortalDeliverable = PortalMilestone["deliverables"][number];
export type PortalActivityRow = Prisma.ActivityGetPayload<{ select: typeof activitySelect }>;

function sharedWith(userId: string) {
  return { status: "ACTIVE", access: { some: { userId } } } satisfies Prisma.ProjectWhereInput;
}

/** The agency's name and team (names only, no emails) for each workspace the projects belong to. */
async function agencies(orgIds: string[]) {
  const unique = [...new Set(orgIds)];
  const entries = await Promise.all(
    unique.map(async (orgId) => {
      const [summary, members] = await Promise.all([getWorkspaceSummary(orgId), getMemberDirectory(orgId)]);
      return [orgId, { name: summary.name, members }] as const;
    }),
  );
  return new Map<string, { name: string; members: Member[] }>(entries);
}

/** Client home: every shared project, and the newest client-visible updates across them. */
export async function getPortalHome(userId: string) {
  const projects = await db.project.findMany({
    where: sharedWith(userId),
    orderBy: { createdAt: "asc" },
    select: projectSelect,
  });
  if (projects.length === 0) return null;

  const [activity, agencyByOrg] = await Promise.all([
    db.activity.findMany({
      where: { projectId: { in: projects.map((p) => p.id) }, visibleToClient: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: activitySelect,
    }),
    agencies(projects.map((p) => p.orgId)),
  ]);

  return { projects, activity, agencyByOrg };
}

/** Client project view: one shared project and its client-visible activity, or null. */
export async function getPortalProject(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, ...sharedWith(userId) },
    select: projectSelect,
  });
  if (!project) return null;

  const [activity, agencyByOrg] = await Promise.all([
    db.activity.findMany({
      where: { projectId: project.id, visibleToClient: true },
      orderBy: { createdAt: "desc" },
      take: 6, // the design's Activity panel shows the six newest
      select: activitySelect,
    }),
    agencies([project.orgId]),
  ]);
  const agency = agencyByOrg.get(project.orgId)!;

  return { project, activity, agency };
}
