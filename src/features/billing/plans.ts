// The one place for plan prices, limits and the words on Pricing.
// Pricing, the sign-up plan note, Billing and the upgrade pop-up all read from here.
// Demo prices (AGENTS.md). TODO(Step 10): check the workspace's plan and limits with Clerk's has().

import { money } from "@/lib/format";

export const PERIODS = ["monthly", "annual"] as const;
export type Period = (typeof PERIODS)[number];

export const PAID_PLANS = ["pro", "agency"] as const;
export type PaidPlanKey = (typeof PAID_PLANS)[number];
export type PlanKey = "free" | PaidPlanKey;

type Plan = {
  key: PlanKey;
  name: string;
  /** Price in dollars for each period. Free is 0. */
  monthly: number;
  annual: number;
  popular: boolean;
  cta: string;
  /** null = no limit. */
  limits: { workspaces: number; projects: number | null; members: number | null; storageGb: number };
  features: readonly string[];
};

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    key: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    popular: false,
    cta: "Start free",
    limits: { workspaces: 1, projects: 2, members: 5, storageGb: 1 },
    features: ["1 workspace", "2 active projects", "Up to 5 team members", "Client portal with approvals", "1 GB of files"],
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthly: 19,
    annual: 190,
    popular: true,
    cta: "Choose Pro",
    limits: { workspaces: 1, projects: null, members: 15, storageGb: 25 },
    features: [
      "Everything in Free",
      "Unlimited projects",
      "Up to 15 team members",
      "Kanban and list views",
      "Full approval history",
      "25 GB of files",
    ],
  },
  agency: {
    key: "agency",
    name: "Agency",
    monthly: 49,
    annual: 490,
    popular: false,
    cta: "Choose Agency",
    limits: { workspaces: 3, projects: null, members: null, storageGb: 100 },
    features: [
      "Everything in Pro",
      "Up to 3 workspaces",
      "Unlimited team members",
      "Admin roles for each workspace",
      "100 GB of files",
    ],
  },
};

export const PLAN_ORDER: readonly PlanKey[] = ["free", "pro", "agency"];

/** What one period costs: "$190". */
export function periodPrice(plan: PlanKey, period: Period): string {
  return money(PLANS[plan][period]);
}

/** The big price on a plan card: Pro annual → "$15.83" "a month" "Billed $190 a year". */
export function priceFor(plan: PlanKey, period: Period): { price: string; per: string; sub: string } {
  const p = PLANS[plan];
  if (p.monthly === 0) return { price: money(0), per: "forever", sub: "No card needed" };
  return period === "annual"
    ? { price: money(p.annual / 12), per: "a month", sub: `Billed ${money(p.annual)} a year` }
    : { price: money(p.monthly), per: "a month", sub: "Billed monthly" };
}

/** Where a plan button goes: Free → /sign-up, paid → /sign-up?plan=pro&period=annual (shows the plan note). */
export function signUpHref(plan: PlanKey, period: Period): string {
  return plan === "free" ? "/sign-up" : `/sign-up?plan=${plan}&period=${period}`;
}
