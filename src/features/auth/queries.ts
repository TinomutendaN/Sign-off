import { clerkClient } from "@clerk/nextjs/server";
import type { AvatarTone } from "@/components/ui/Avatar";
import { getClientCompanyName } from "@/features/clients/queries";
import { displayName, initials, nameInitials } from "@/lib/format";
import type { DemoRole } from "./schemas";

export type DemoCard = {
  role: DemoRole;
  title: string;
  who: string;
  initials: string;
  tone: AvatarTone;
  description: string;
  /** Ends the button text: "Enter the demo as agency owner". */
  buttonLabel: string;
};

/**
 * The four "Try the demo" cards. Names come from Clerk and the database, never hard-coded:
 * the owner and team member show their Clerk names, the client shows their company.
 */
export async function getDemoCards(): Promise<DemoCard[]> {
  const ownerId = process.env.DEMO_OWNER_USER_ID?.trim();
  const memberId = process.env.DEMO_AMA_USER_ID?.trim();
  const clientId = process.env.DEMO_CLIENT_USER_ID?.trim();
  const orgId = process.env.DEMO_ORG_ID?.trim();

  const clerk = await clerkClient();
  const ids = [ownerId, memberId].filter((id): id is string => Boolean(id));
  const [users, org, company] = await Promise.all([
    ids.length ? clerk.users.getUserList({ userId: ids, limit: ids.length }).then((r) => r.data) : [],
    orgId ? clerk.organizations.getOrganization({ organizationId: orgId }).catch(() => null) : null,
    clientId ? getClientCompanyName(clientId) : null,
  ]);

  const workspace = org?.name ?? "Demo workspace";
  const person = (id: string | undefined) => users.find((u) => u.id === id) ?? { firstName: "Demo", lastName: "" };
  const owner = person(ownerId);
  const member = person(memberId);
  const clientName = company ?? "Client";

  return [
    {
      role: "owner",
      title: "Agency owner",
      who: `${displayName(owner)} · ${workspace}`,
      initials: initials(owner),
      tone: "violet",
      description: "Run projects, invite clients and manage billing.",
      buttonLabel: "agency owner",
    },
    {
      role: "member",
      title: "Team member",
      who: `${displayName(member)} · ${workspace}`,
      initials: initials(member),
      tone: "green",
      description: "Work on tasks and upload deliverables.",
      buttonLabel: "team member",
    },
    {
      role: "client",
      title: "Client",
      who: clientName,
      initials: nameInitials(clientName),
      tone: "peach",
      description: "See progress and approve or request changes.",
      buttonLabel: "client",
    },
    {
      role: "admin",
      title: "SIGNoFF admin",
      who: "Platform owner",
      initials: "So",
      tone: "navy",
      description: "See subscribers, plans and monthly revenue.",
      buttonLabel: "admin",
    },
  ];
}
