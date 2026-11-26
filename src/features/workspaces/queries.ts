import { clerkClient } from "@clerk/nextjs/server";
import { cache } from "react";
import { avatarTone, type AvatarTone } from "@/lib/format";

/** Workspace name and member count for the agency side panel. */
export async function getWorkspaceSummary(orgId: string) {
  const clerk = await clerkClient();
  const org = await clerk.organizations.getOrganization({ organizationId: orgId, includeMembersCount: true });
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

/**
 * The workspace's team, in the order they joined (the Owner first), keyed by Clerk user ID.
 * Cached per request, because the header, board and list all need it.
 */
export const getMemberDirectory = cache(async (orgId: string): Promise<Member[]> => {
  const clerk = await clerkClient();
  const { data } = await clerk.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 });
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
});
