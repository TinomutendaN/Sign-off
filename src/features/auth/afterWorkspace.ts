import type { ChosenPlan } from "./schemas";

/**
 * Where a new workspace opens: /dashboard, or, when a paid plan was chosen on Pricing,
 * Billing with Clerk's checkout for that plan and period opening straight away.
 */
export function afterWorkspaceUrl(plan: ChosenPlan | null): string {
  return plan ? `/billing?checkout=${plan.plan}&period=${plan.period}` : "/dashboard";
}
