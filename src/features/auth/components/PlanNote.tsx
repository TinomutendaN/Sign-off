import Link from "next/link";
import { CardIcon } from "@/components/icons";
import type { ChosenPlan } from "../schemas";

// Demo prices (AGENTS.md). Step 10 moves plans to Clerk Billing.
const PRICES = {
  pro: { name: "Pro", monthly: 19, annual: 190 },
  agency: { name: "Agency", monthly: 49, annual: 490 },
} as const;

/** Lavender note shown only when someone arrives from Pricing with a plan chosen. */
export function PlanNote({ plan }: { plan: ChosenPlan }) {
  const price = PRICES[plan.plan];
  const amount = plan.period === "annual" ? price.annual : price.monthly;
  const unit = plan.period === "annual" ? "year" : "month";

  return (
    <div className="flex items-center gap-3 rounded-card bg-violet-tint px-[14px] py-3 text-[13px] text-ink-2">
      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-switch bg-card text-violet-icon">
        <CardIcon size={16} strokeWidth={2} />
      </span>
      <span className="flex-1">
        <span className="font-semibold">
          {price.name} · {plan.period}, ${amount} a {unit}.
        </span>{" "}
        You&apos;ll pay in a secure checkout window.
      </span>
      <Link href="/pricing" className="text-xs font-medium">
        Change
      </Link>
    </div>
  );
}
