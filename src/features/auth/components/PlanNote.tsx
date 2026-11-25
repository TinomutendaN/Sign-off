import Link from "next/link";
import { CardIcon } from "@/components/icons";
import { PLANS, periodPrice } from "@/features/billing/plans";
import type { ChosenPlan } from "../schemas";

/** Lavender note shown only when someone arrives from Pricing with a plan chosen. */
export function PlanNote({ plan }: { plan: ChosenPlan }) {
  const name = PLANS[plan.plan].name;
  const amount = periodPrice(plan.plan, plan.period);
  const unit = plan.period === "annual" ? "year" : "month";

  return (
    <div className="flex items-center gap-3 rounded-card bg-violet-tint px-[14px] py-3 text-[13px] text-ink-2">
      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-switch bg-card text-violet-icon">
        <CardIcon size={16} strokeWidth={2} />
      </span>
      <span className="flex-1">
        <span className="font-semibold">
          {name} · {plan.period}, {amount} a {unit}.
        </span>{" "}
        You&apos;ll pay in a secure checkout window.
      </span>
      <Link href="/pricing" className="text-xs font-medium">
        Change
      </Link>
    </div>
  );
}
