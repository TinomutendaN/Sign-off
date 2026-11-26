import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { avatarTone, displayName, nameInitials, shortDate } from "@/lib/format";
import { clientTone, listWords } from "./look";

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
          milestones: { select: { _count: { select: { deliverables: { where: { status: "WAITING", nextVersion: { is: null } } } } } } },
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

/** Whether the person can see this project as a client (or any project, if none is given). */
export async function hasClientAccess(userId: string, projectId?: string) {
  const row = await db.clientAccess.findFirst({
    where: { userId, ...(projectId ? { projectId } : {}), project: { status: "ACTIVE" } },
    select: { id: true },
  });
  return row !== null;
}

/** The client company a person belongs to ("Brightline Bakery"), used for their avatar. */
export async function getClientCompanyName(userId: string) {
  const row = await db.clientAccess.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { client: { select: { name: true } } },
  });
  return row?.client.name ?? null;
}

// ---------- Agency side: Clients screen and Team settings ----------

/** What a client did last, in the words of the "Last activity" tile. */
const CLIENT_ACTION: Partial<Record<string, string>> = {
  CHANGES_REQUESTED: "Asked for changes",
  DELIVERABLE_APPROVED: "Approved work",
  MILESTONE_COMPLETED: "Approved a milestone",
};

/** "Invited just now" for the first few minutes, then "Invited, 26 Nov". */
function invitedLabel(invitedAt: Date, now: Date) {
  return now.getTime() - invitedAt.getTime() < 5 * 60_000 ? "Invited just now" : `Invited, ${shortDate(invitedAt)}`;
}

/**
 * Every client of the workspace, newest first, for the Clients screen: contact, status
 * (Active once someone has portal access, otherwise Invite sent), active projects, how many
 * deliverables wait on them and what they did last. `tone` keeps each company's square colour
 * stable by the order clients were added.
 */
export async function listClients(orgId: string) {
  const clients = await db.client.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      contactName: true,
      contactEmail: true,
      invitedAt: true,
      createdAt: true,
      access: { orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } },
      projects: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          colour: true,
          milestones: {
            select: {
              _count: { select: { deliverables: { where: { status: "WAITING", nextVersion: { is: null } } } } },
            },
          },
        },
      },
    },
  });

  const lastActions = await Promise.all(
    clients.map((c) =>
      db.activity.findFirst({
        where: { orgId, actorKind: "CLIENT", project: { clientId: c.id } },
        orderBy: { createdAt: "desc" },
        select: { type: true, createdAt: true },
      }),
    ),
  );

  const now = new Date();
  return clients
    .map((c, index) => {
      const joined = c.access[0]?.createdAt ?? null;
      const last = lastActions[index];
      const lastActivity = last
        ? `${CLIENT_ACTION[last.type] ?? "Updated"}, ${shortDate(last.createdAt)}`
        : joined
          ? `Joined, ${shortDate(joined)}`
          : invitedLabel(c.invitedAt ?? c.createdAt, now);
      return {
        id: c.id,
        name: c.name,
        initials: nameInitials(c.name),
        tone: clientTone(index),
        contact: `${c.contactName} · ${c.contactEmail}`,
        active: joined !== null,
        projects: c.projects.map((p) => ({ id: p.id, name: p.name, colour: p.colour })),
        waiting: c.projects.reduce(
          (sum, p) => sum + p.milestones.reduce((s, m) => s + m._count.deliverables, 0),
          0,
        ),
        lastActivity,
        search: `${c.name} ${c.contactName} ${c.contactEmail}`.toLowerCase(),
      };
    })
    .reverse();
}

export type ClientSummary = Awaited<ReturnType<typeof listClients>>[number];

/**
 * Team settings "Client access": who on each client's side can see what. Names come from Clerk
 * once they've joined (the contact name until then). No email addresses are returned.
 */
export async function listClientAccess(orgId: string) {
  const clients = await db.client.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      contactName: true,
      access: {
        where: { project: { status: "ACTIVE" } },
        orderBy: { project: { createdAt: "asc" } },
        select: { userId: true, project: { select: { name: true } } },
      },
      invites: {
        where: { claimedAt: null, project: { status: "ACTIVE" } },
        select: { project: { select: { name: true } } },
      },
    },
  });

  const userIds = [...new Set(clients.flatMap((c) => c.access.map((a) => a.userId)))];
  const users = userIds.length
    ? (await (await clerkClient()).users.getUserList({ userId: userIds, limit: userIds.length })).data
    : [];

  return clients.map((c, index) => {
    const joined = c.access.length > 0;
    const people = [...new Set(c.access.map((a) => a.userId))].map((id) => {
      const user = users.find((u) => u.id === id);
      return user ? displayName(user) : c.contactName;
    });
    const projects = [...new Set((joined ? c.access : c.invites).map((a) => a.project.name))];
    return {
      id: c.id,
      initials: nameInitials(c.name),
      tone: clientTone(index),
      title: `${joined ? listWords(people) : c.contactName} · ${c.name}`,
      sees: projects.length
        ? joined
          ? `Sees ${listWords(projects)} only`
          : `Will see ${listWords(projects)} once they join`
        : "No active projects",
      joined,
    };
  });
}

/**
 * What the invited sign-up page shows for /sign-up?client={id}: the company, the agency, the
 * project and the invited email (fixed, since the invitation decides it). Null if the client
 * has no open invite.
 */
export async function getClientInviteContext(clientId: string) {
  const invite = await db.clientInvite.findFirst({
    where: { clientId, claimedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      email: true,
      orgId: true,
      client: { select: { name: true } },
      project: { select: { name: true } },
    },
  });
  if (!invite) return null;
  const clerk = await clerkClient();
  const org = await clerk.organizations.getOrganization({ organizationId: invite.orgId }).catch(() => null);
  return {
    email: invite.email,
    company: invite.client.name,
    projectName: invite.project.name,
    agencyName: org?.name ?? "Your agency",
  };
}
