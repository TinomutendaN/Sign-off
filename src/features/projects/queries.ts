import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import type { Member } from "@/features/workspaces/queries";
import { db } from "@/lib/db";

/** Active projects for the agency side panel ("CLIENTS & PROJECTS"). */
export async function listSidebarProjects(orgId: string) {
  const projects = await db.project.findMany({
    where: { orgId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      colour: true,
      client: { select: { name: true } },
      _count: { select: { tasks: true } },
    },
  });
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    colour: p.colour,
    clientName: p.client.name,
    taskCount: p._count.tasks,
  }));
}

const milestoneSelect = {
  orderBy: { number: "asc" },
  select: {
    id: true,
    number: true,
    name: true,
    status: true,
    approvedAt: true,
    tasks: { select: { status: true } },
  },
} satisfies Prisma.Project$milestonesArgs;

const teamTasksSelect = {
  where: { assigneeId: { not: null } },
  orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  select: { assigneeId: true },
} satisfies Prisma.Project$tasksArgs;

/**
 * The people on a project: the Owner first (if they have tasks there), then everyone else
 * in the order they were first given a task. Only current workspace members are shown.
 */
export function projectTeam(tasks: { assigneeId: string | null }[], members: Member[]): Member[] {
  const seen: Member[] = [];
  for (const t of tasks) {
    const m = members.find((x) => x.id === t.assigneeId);
    if (m && !seen.includes(m)) seen.push(m);
  }
  return [...seen.filter((m) => m.isOwner), ...seen.filter((m) => !m.isOwner)];
}

/** Every project in the workspace for the Projects list (archived included; the tabs filter). */
export async function listProjects(orgId: string) {
  return db.project.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      colour: true,
      dueDate: true,
      status: true,
      client: { select: { name: true } },
      milestones: milestoneSelect,
      tasks: teamTasksSelect,
    },
  });
}

/**
 * The project header, milestone strip and team for the project pages. Returns null when the
 * project isn't in this workspace, so other workspaces get a 404. Cached per request.
 */
export const getProjectHeader = cache(async (projectId: string, orgId: string) => {
  return db.project.findFirst({
    where: { id: projectId, orgId },
    select: {
      id: true,
      name: true,
      dueDate: true,
      status: true,
      client: { select: { name: true } },
      milestones: milestoneSelect,
      tasks: teamTasksSelect,
    },
  });
});
