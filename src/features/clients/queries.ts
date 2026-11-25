import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { avatarTone, displayName } from "@/lib/format";

/**
 * Everything the client portal side panel needs: the client's company, their projects
 * (with how many deliverables wait on them), and their agency contact. The contact is
 * whoever sent the client's most recent deliverable; their note ("Project lead") comes
 * from their Clerk organization membership. No email addresses are returned.
 */
export async function getPortalSidebar(userId: string) {
  const access = await db.clientAccess.findMany({
    where: { userId, project: { status: "ACTIVE" } },
    orderBy: { project: { createdAt: "asc" } },
    select: {
      client: { select: { name: true, orgId: true } },
      project: {
        select: {
          id: true,
          name: true,
          colour: true,
          milestones: { select: { _count: { select: { deliverables: { where: { status: "WAITING" } } } } } },
        },
      },
    },
  });

  if (access.length === 0) return null;

  const { client } = access[0];
  const projects = access.map(({ project }) => ({
    id: project.id,
    name: project.name,
    colour: project.colour,
    waitingCount: project.milestones.reduce((sum, m) => sum + m._count.deliverables, 0),
  }));

  const latest = await db.deliverable.findFirst({
    where: { milestone: { projectId: { in: projects.map((p) => p.id) } } },
    orderBy: { sentAt: "desc" },
    select: { sentById: true },
  });

  const clerk = await clerkClient();
  const [org, memberships] = await Promise.all([
    clerk.organizations.getOrganization({ organizationId: client.orgId }),
    latest
      ? clerk.organizations.getOrganizationMembershipList({ organizationId: client.orgId, userId: [latest.sentById] })
      : null,
  ]);

  const membership = memberships?.data[0];
  const note = membership?.publicMetadata?.note;
  const contact = membership?.publicUserData
    ? {
        userId: membership.publicUserData.userId,
        firstName: membership.publicUserData.firstName,
        lastName: membership.publicUserData.lastName,
        name: displayName(membership.publicUserData),
        tone: avatarTone(membership.publicUserData.userId),
        note: typeof note === "string" && note.trim() ? note.trim() : "Team member",
      }
    : null;

  return { clientName: client.name, agencyName: org.name, projects, contact };
}

/** The first project a client can see (the portal's "Projects" menu item). */
export async function getFirstPortalProjectId(userId: string) {
  const first = await db.clientAccess.findFirst({
    where: { userId, project: { status: "ACTIVE" } },
    orderBy: { project: { createdAt: "asc" } },
    select: { projectId: true },
  });
  return first?.projectId ?? null;
}
