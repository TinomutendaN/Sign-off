import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { PLANS, priceFor, signUpHref, type Period, type PlanKey } from "../plans";

/** One white plan card on Pricing. The popular plan (Pro) gets the violet outline and button. */
export function PricingPlanCard({ planKey, period }: { planKey: PlanKey; period: Period }) {
  const plan = PLANS[planKey];
  const { price, per, sub } = priceFor(planKey, period);

  return (
    <article
      className={cx(
        "relative flex flex-col gap-[18px] rounded-feature bg-card p-6",
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
      <p className="m-0 min-h-[42px] text-sm leading-normal text-muted">{plan.blurb}</p>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[40px] font-semibold tracking-[-0.02em]">{price}</span>
          <span className="text-sm text-muted">{per}</span>
        </div>
        <div className="min-h-4 text-xs text-muted">{sub}</div>
      </div>
      <Button href={signUpHref(planKey, period)} variant={plan.popular ? "primary" : "outline"} size="md">
        {plan.cta}
      </Button>
      <div className="h-px bg-soft-2" />
      <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
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
