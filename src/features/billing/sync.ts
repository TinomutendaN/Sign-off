import { createClerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { displayName } from "@/lib/format";
import { planFromSlug, PLANS } from "./plans";

// Copies a workspace's Clerk Billing subscription into our Subscription table (the admin numbers)
// and sets the workspace's member limit to match its plan. Called by the Clerk webhook.
//
// Safe to run any number of times, in any order: it ignores what the event said and reads the
// subscription's current state from Clerk, then upserts one row per Clerk subscription.
// Free workspaces get no row; a paid row whose plan has gone becomes Cancelled.

function clerk() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
}

export type SyncResult = { orgId: string; plan: string; status: "ACTIVE" | "CANCELLED" | "NONE" };

export async function syncOrgSubscription(orgId: string): Promise<SyncResult> {
  const api = clerk();
  const [sub, org, memberships] = await Promise.all([
    api.billing.getOrganizationBillingSubscription(orgId),
    api.organizations.getOrganization({ organizationId: orgId, includeMembersCount: true }),
    api.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
  ]);

  const paid = sub.subscriptionItems.find(
    (i) =>
      planFromSlug(i.plan?.slug) !== "free" &&
      (i.status === "active" || i.status === "past_due" || i.status === "canceled"),
  );
  const planKey = planFromSlug(paid?.plan?.slug);

  // The member limit follows the plan. Clerk may refuse a limit below the current team size.
  const maxMembers = PLANS[planKey].limits.members;
  if (org.maxAllowedMemberships !== maxMembers) {
    await api.organizations
      .updateOrganization(orgId, { maxAllowedMemberships: maxMembers })
      .catch((error) => console.error("syncOrgSubscription: member limit not updated", error));
  }

  const existing = await db.subscription.findUnique({ where: { clerkSubscriptionId: sub.id } });

  if (!paid) {
    if (existing?.status === "ACTIVE") {
      await db.subscription.update({
        where: { id: existing.id },
        data: { status: "CANCELLED", endedAt: new Date() },
      });
      return { orgId, plan: "free", status: "CANCELLED" };
    }
    return { orgId, plan: "free", status: existing ? "CANCELLED" : "NONE" };
  }

  const owner = memberships.data
    .filter((m) => m.role === "org:admin" && m.publicUserData)
    .sort((a, b) => a.createdAt - b.createdAt)[0]?.publicUserData;
  const period = paid.planPeriod === "annual" ? "ANNUAL" : "MONTHLY";
  const cancelled = paid.status === "canceled" || paid.canceledAt != null;
  const status = cancelled ? "CANCELLED" : "ACTIVE";
  const plan = planKey === "agency" ? "AGENCY" : "PRO";
  // The designed price in cents ($190, not Clerk's $189.96), like the seeded demo rows.
  const amount = Math.round(PLANS[planKey][period === "ANNUAL" ? "annual" : "monthly"] * 100);
  // Never create a row for a plan that is already cancelled (e.g. the demo reset ending it).
  if (!existing && cancelled) return { orgId, plan: planKey, status: "NONE" };
  const reactivated = existing?.status === "CANCELLED" && status === "ACTIVE";

  const data = {
    orgId,
    plan,
    period,
    amount,
    status,
    endedAt: cancelled ? new Date(paid.canceledAt ?? Date.now()) : null,
    workspaceName: org.name,
    ownerName: owner ? displayName(owner) : null,
    memberCount: org.membersCount ?? memberships.data.length,
    isDemo: false,
  } as const;

  const upsert = () =>
    db.subscription.upsert({
      where: { clerkSubscriptionId: sub.id },
      create: { ...data, clerkSubscriptionId: sub.id, startedAt: new Date(paid.createdAt) },
      update: reactivated ? { ...data, startedAt: new Date() } : data,
    });

  try {
    await upsert();
  } catch (error) {
    // Two deliveries at once can both try to create the row; the second one updates instead.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") await upsert();
    else throw error;
  }

  return { orgId, plan: planKey, status };
}
