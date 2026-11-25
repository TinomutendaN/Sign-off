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
