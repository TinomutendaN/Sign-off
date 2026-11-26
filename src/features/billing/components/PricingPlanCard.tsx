"use client";

import { useAuth } from "@clerk/nextjs";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { PLANS, planFromHas, priceFor, signUpHref, type PaidPlanKey, type Period, type PlanKey } from "../plans";
import { PlanCheckoutButton } from "./PlanCheckoutButton";

type PricingPlanCardProps = {
  planKey: PlanKey;
  period: Period;
  planIds: Record<PaidPlanKey, string | null>;
};

/**
 * One white plan card on Pricing. The popular plan (Pro) gets the violet outline and button.
 * Signed out (or not a workspace Owner), the button goes to sign-up with the plan chosen. A signed-in
 * Owner gets Clerk's checkout straight away, and "Current plan" on the plan they're on.
 */
export function PricingPlanCard({ planKey, period, planIds }: PricingPlanCardProps) {
  const plan = PLANS[planKey];
  const { price, per, sub } = priceFor(planKey, period);
  const { isLoaded, orgId, orgRole, has } = useAuth();
  const owner = isLoaded && orgId && orgRole === "org:admin";
  const current = owner ? planFromHas(has) : null;
  const variant = plan.popular ? "primary" : "outline";

  function action() {
    if (!owner) {
      return (
        <Button href={signUpHref(planKey, period)} variant={variant} size="md">
          {plan.cta}
        </Button>
      );
    }
    if (current === planKey) {
      return (
        <Button variant={variant} size="md" disabled>
          Current plan
        </Button>
      );
    }
    if (planKey === "free") {
      return (
        <Button href="/billing" variant={variant} size="md">
          Change on Billing
        </Button>
      );
    }
    return (
      <PlanCheckoutButton planId={planIds[planKey]} period={period} variant={variant}>
        {plan.cta}
      </PlanCheckoutButton>
    );
  }

  return (
    <article
      className={cx(
        "relative flex flex-col gap-3.5 rounded-feature bg-card p-5",
        plan.popular ? "shadow-plan-featured outline-2 outline-violet" : "shadow-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-lg font-semibold">{plan.name}</h2>
        {plan.popular && (
          <span className="rounded-full bg-violet-tint px-[9px] py-1 text-[11px] font-semibold text-violet-ink">
            Most popular
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[40px] font-semibold tracking-[-0.02em]">{price}</span>
          <span className="text-sm text-muted">{per}</span>
        </div>
        <div className="min-h-4 text-xs text-muted">{sub}</div>
      </div>
      {action()}
      <div className="h-px bg-soft-2" />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-[10px] text-sm leading-[1.45] text-ink-2">
            <CheckIcon className="mt-px shrink-0 text-violet" />
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}
