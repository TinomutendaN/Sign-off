import { clerkClient, createClerkClient } from "@clerk/nextjs/server";
import { cacheLife, cacheTag } from "next/cache";
import { avatarTone, type AvatarTone } from "@/lib/format";

// Workspace name and team rarely change, so they're remembered for a few minutes instead of
// asking Clerk on every page. Cached functions can't read the request, so they use a Clerk
// client built from the secret key. When membership changes (Step 9 invites, role changes),
// call revalidateTag(workspaceTag(orgId)) so the new team shows straight away.

/** Cache tag for one workspace's Clerk data (name, members). */
export function workspaceTag(orgId: string) {
  return `workspace:${orgId}`;
}

function cachedClerk() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
}

/** Workspace name and member count for the agency side panel. */
export async function getWorkspaceSummary(orgId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(workspaceTag(orgId));

  const org = await cachedClerk().organizations.getOrganization({ organizationId: orgId, includeMembersCount: true });
  return { name: org.name, membersCount: org.membersCount ?? 0 };
}

/** IDs of every workspace (Clerk organization) the person belongs to. */
export async function getUserOrgIds(userId: string) {
  const clerk = await clerkClient();
  const { data } = await clerk.users.getOrganizationMembershipList({ userId, limit: 100 });
  return data.map((m) => m.organization.id);
}

/** A team member as the app shows them: name parts and avatar colour. Never an email. */
export type Member = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  tone: AvatarTone;
  isOwner: boolean;
};

/** The workspace's team, in the order they joined (the Owner first). */
export async function getMemberDirectory(orgId: string): Promise<Member[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(workspaceTag(orgId));

  const { data } = await cachedClerk().organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });
  return data
    .filter((m) => m.publicUserData?.userId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => {
      const id = m.publicUserData!.userId;
      return {
        id,
        firstName: m.publicUserData!.firstName,
        lastName: m.publicUserData!.lastName,
        tone: avatarTone(id),
        isOwner: m.role === "org:admin",
      };
    });
}

/** An invited person's display name, from the part of their email before the @: "kuda.m@…" → "Kuda". */
export function inviteeName(email: string) {
  const word = email.split("@")[0].split("+")[0].split(/[._-]/)[0] || "Invitee";
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Team settings (09). Read fresh from Clerk on every visit, so a new invite shows straight away.
 * Members carry their name parts, role and note (organization membership metadata); pending
 * invitations carry a name made from the address, never the address itself.
 */
export async function getTeamSettings(orgId: string) {
  const clerk = await clerkClient();
  const [org, memberships, invitations] = await Promise.all([
    clerk.organizations.getOrganization({ organizationId: orgId }),
    clerk.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
    clerk.organizations.getOrganizationInvitationList({ organizationId: orgId, status: ["pending"], limit: 100 }),
  ]);

  const members = memberships.data
    .filter((m) => m.publicUserData?.userId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => {
      const note = m.publicMetadata?.note;
      return {
        id: m.publicUserData!.userId,
        firstName: m.publicUserData!.firstName,
        lastName: m.publicUserData!.lastName,
        tone: avatarTone(m.publicUserData!.userId),
        isOwner: m.role === "org:admin",
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      };
    });

  const pending = invitations.data
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((i) => ({ id: i.id, name: inviteeName(i.emailAddress), createdAt: new Date(i.createdAt) }));

  return { name: org.name, maxMembers: org.maxAllowedMemberships, members, pending };
}
