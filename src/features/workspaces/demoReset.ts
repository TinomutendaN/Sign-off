import { createClerkClient } from "@clerk/nextjs/server";
import { del, list } from "@vercel/blob";
import type { PrismaClient } from "@/generated/prisma/client";
import { planFromSlug, PLANS } from "@/features/billing/plans";

// Puts the public demo workspace (Northfold Studio, DEMO_ORG_ID) back to what every visitor
// should see first. Used by the seed, the nightly cron and the "Reset demo" link on Billing.
// Only ever touches DEMO_ORG_ID.

function demoOrgId(): string {
  const orgId = process.env.DEMO_ORG_ID?.trim();
  if (!orgId) throw new Error("DEMO_ORG_ID is not set, so there is no demo workspace to reset.");
  return orgId;
}

/**
 * Moves Northfold back to Free: ends every paid plan in Clerk at once (Clerk falls back to the
 * default Free plan), deletes the real (non-demo) Subscription rows a visitor's upgrade created,
 * and sets the member limit back to Free's. Returns how many paid plans were ended.
 */
export async function resetDemoBilling(db: PrismaClient): Promise<number> {
  const orgId = demoOrgId();
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  let ended = 0;
  const sub = await clerk.billing.getOrganizationBillingSubscription(orgId).catch(() => null);
  for (const item of sub?.subscriptionItems ?? []) {
    const paid = planFromSlug(item.plan?.slug) !== "free";
    const live = item.status === "active" || item.status === "past_due" || item.status === "canceled" || item.status === "upcoming";
    if (paid && live) {
      await clerk.billing.cancelSubscriptionItem(item.id, { endNow: true });
      ended += 1;
    }
  }

  await db.subscription.deleteMany({ where: { orgId, isDemo: false } });
  await clerk.organizations.updateOrganization(orgId, { maxAllowedMemberships: PLANS.free.limits.members });
  return ended;
}

/**
 * Deletes every Blob file under orgs/{DEMO_ORG_ID}/ (visitors' deliverable uploads).
 * Never touches other workspaces' folders or the sample files in public/demo-files.
 * Returns how many files were deleted.
 */
export async function resetDemoFiles(): Promise<number> {
  const prefix = `orgs/${demoOrgId()}/`;
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    const urls = page.blobs.filter((b) => b.pathname.startsWith(prefix)).map((b) => b.url);
    if (urls.length > 0) {
      await del(urls);
      deleted += urls.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}
