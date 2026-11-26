import { auth, createClerkClient } from "@clerk/nextjs/server";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { billingTag, planFromHas, planFromSlug, PLANS, type PaidPlanKey, type Period, type PlanKey } from "./plans";

// Reads only. The workspace's plan for limits comes from the session (Clerk's has()); the details
// shown on Billing and in the side panel (period, renewal date) come from Clerk Billing's backend
// API, remembered until the webhook or a checkout clears billingTag(orgId).

function cachedClerk() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
}

/** What Billing and the side panel show about the workspace's plan. Dates are milliseconds. */
export type BillingState = {
  plan: PlanKey;
  /** null on Free. */
  period: Period | null;
  /** Cancelled in Clerk, still paid until `endsAt`. */
  cancelled: boolean;
  pastDue: boolean;
  /** Next renewal (paid and not cancelled). */
  renewsAt: number | null;
  /** When a cancelled plan stops. */
  endsAt: number | null;
  /** A change Clerk has scheduled for the end of the period (e.g. a switch to monthly). */
  upcoming: { plan: PlanKey; period: Period; startsAt: number } | null;
};

const FREE: BillingState = {
  plan: "free",
  period: null,
  cancelled: false,
  pastDue: false,
  renewsAt: null,
  endsAt: null,
  upcoming: null,
};

function toPeriod(planPeriod: "month" | "annual"): Period {
  return planPeriod === "annual" ? "annual" : "monthly";
}

/** The workspace's plan from Clerk Billing. Falls back to Free if Clerk can't be reached. */
export async function getBillingState(orgId: string): Promise<BillingState> {
  "use cache";
  cacheLife("minutes");
  cacheTag(billingTag(orgId));

  try {
    const sub = await cachedClerk().billing.getOrganizationBillingSubscription(orgId);
    const items = sub.subscriptionItems;
    // A cancelled item keeps status "canceled" until its period ends, then becomes "ended".
    const paid = items.find(
      (i) =>
        planFromSlug(i.plan?.slug) !== "free" &&
        (i.status === "active" || i.status === "past_due" || i.status === "canceled"),
    );
    const next = items.find((i) => i.status === "upcoming" && i.id !== paid?.id);
    const upcoming = next
      ? { plan: planFromSlug(next.plan?.slug), period: toPeriod(next.planPeriod), startsAt: next.periodStart }
      : null;
    if (!paid) return { ...FREE, upcoming };

    const cancelled = paid.status === "canceled" || paid.canceledAt != null;
    return {
      plan: planFromSlug(paid.plan?.slug),
      period: toPeriod(paid.planPeriod),
      cancelled,
      pastDue: paid.status === "past_due",
      renewsAt: cancelled ? null : (paid.periodEnd ?? null),
      endsAt: cancelled ? (paid.periodEnd ?? null) : null,
      upcoming,
    };
  } catch (error) {
    console.error("getBillingState failed", error);
    return FREE;
  }
}

/** Clerk plan IDs for the paid plans, which checkout needs. */
export async function getPlanIds(): Promise<Record<PaidPlanKey, string | null>> {
  "use cache";
  cacheLife("hours");

  try {
    const { data } = await cachedClerk().billing.getPlanList({ payerType: "org" });
    const id = (slug: string) => data.find((p) => p.slug === slug)?.id ?? null;
    return { pro: id("pro"), agency: id("agency") };
  } catch (error) {
    console.error("getPlanIds failed", error);
    return { pro: null, agency: null };
  }
}

/** Active projects (archived ones don't count towards the plan). */
export function countActiveProjects(orgId: string) {
  return db.project.count({ where: { orgId, status: "ACTIVE" } });
}

/** Bytes used by deliverables and task files in the workspace. */
export async function storageUsed(orgId: string): Promise<number> {
  const [deliverables, files] = await Promise.all([
    db.deliverable.aggregate({ where: { milestone: { project: { orgId } } }, _sum: { size: true } }),
    db.taskFile.aggregate({ where: { task: { project: { orgId } } }, _sum: { size: true } }),
  ]);
  return (deliverables._sum.size ?? 0) + (files._sum.size ?? 0);
}

/**
 * The plan and its limits for server checks (Server Actions, the upload route), from the session.
 * Never cached: it reads the request.
 */
export async function getPlanLimits() {
  const { has, orgId } = await auth();
  const plan = orgId ? planFromHas(has) : "free";
  return { plan, limits: PLANS[plan].limits };
}

/** True when the workspace's plan allows no more active projects (Free: 2). */
export async function projectLimitReached(orgId: string): Promise<boolean> {
  const { limits } = await getPlanLimits();
  if (limits.projects === null) return false;
  return (await countActiveProjects(orgId)) >= limits.projects;
}
