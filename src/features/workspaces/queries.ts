import { clerkClient } from "@clerk/nextjs/server";

/** Workspace name and member count for the agency side panel. */
export async function getWorkspaceSummary(orgId: string) {
  const clerk = await clerkClient();
  const org = await clerk.organizations.getOrganization({ organizationId: orgId, includeMembersCount: true });
  return { name: org.name, membersCount: org.membersCount ?? 0 };
}
