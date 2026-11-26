"use client";

import { SubscriptionDetailsButton } from "@clerk/nextjs/experimental";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { longDate, money } from "@/lib/format";
import { refreshBilling } from "../actions";
import { PLANS, periodPrice, type PaidPlanKey, type Period } from "../plans";
import type { BillingState } from "../queries";
import { PlanCheckoutButton } from "./PlanCheckoutButton";

type CurrentPlanCardProps = {
  billing: BillingState;
  planIds: Record<PaidPlanKey, string | null>;
  /** /billing?checkout=pro&period=annual (after sign-up with a plan): open that checkout at once. */
  autoCheckout: { plan: PaidPlanKey; period: Period } | null;
};

function freeNote() {
  const { workspaces, projects, members } = PLANS.free.limits;
  return `${workspaces} workspace, ${projects} projects, up to ${members} team members`;
}

function paidNote(billing: BillingState) {
  const lines: string[] = [];
  if (billing.cancelled && billing.endsAt) lines.push(`Ends on ${longDate(new Date(billing.endsAt))}`);
  else if (billing.renewsAt) lines.push(`Renews on ${longDate(new Date(billing.renewsAt))}`);
  const next = billing.upcoming;
  if (next && next.plan !== "free") {
    const change = next.plan === billing.plan ? next.period : `${PLANS[next.plan].name} · ${next.period}`;
    lines.push(`Switches to ${change} on ${longDate(new Date(next.startsAt))}`);
  }
  return lines.join(" · ");
}

/** Billing's "Current plan" card: Free with the two upgrade buttons, or the paid plan with "Manage subscription". */
export function CurrentPlanCard({ billing, planIds, autoCheckout }: CurrentPlanCardProps) {
  const router = useRouter();
  const plan = PLANS[billing.plan];
  const paid = billing.plan !== "free" && billing.period !== null;
  const annual = billing.period === "annual";

  const price = paid ? periodPrice(billing.plan, billing.period!) : money(0);
  const per = !paid ? "forever" : annual ? `a year (${money(plan.annual / 12)} a month)` : "a month";

  return (
    <Card className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-[1_1_200px] flex-col gap-1">
          <div className="flex items-center gap-[10px]">
            <span className="text-[22px] font-semibold">{plan.name}</span>
            <Pill tone={paid ? "violet" : "grey"}>{paid ? (annual ? "Annual" : "Monthly") : "Free forever"}</Pill>
          </div>
          <div className="text-[13px] text-muted">{paid ? paidNote(billing) : freeNote()}</div>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-semibold tracking-[-0.02em]">{price}</div>
          <div className="text-xs text-muted">{per}</div>
        </div>
      </div>
      <div className="h-px bg-soft-2" />

      {paid ? (
        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-wrap gap-[10px]">
            <SubscriptionDetailsButton
              for="organization"
              onSubscriptionCancel={async () => {
                await refreshBilling();
                router.refresh();
              }}
            >
              <Button size="md" className="flex-[1_1_200px] py-[11px]" icon={<ExternalLinkIcon />}>
                Manage subscription
              </Button>
            </SubscriptionDetailsButton>
          </div>
          <div className="text-[11px] text-muted">
            Opens your subscription details, where you can change plan, switch to monthly or annual, update your card or
            cancel.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          <div className="text-[13px] text-ink-2">
            Pro gives you unlimited projects, up to {PLANS.pro.limits.members} team members and {PLANS.pro.limits.storageGb}{" "}
            GB of files.
          </div>
          <div className="flex flex-wrap gap-[10px]">
            <PlanCheckoutButton planId={planIds.pro} period="annual" className="flex-[1_1_180px] py-[11px]">
              Upgrade to Pro · {periodPrice("pro", "annual")} a year
            </PlanCheckoutButton>
            <PlanCheckoutButton planId={planIds.pro} period="monthly" variant="outline" className="flex-[1_1_140px] py-[11px]">
              Pay monthly · {periodPrice("pro", "monthly")}
            </PlanCheckoutButton>
          </div>
          <div className="text-[11px] text-muted">You&apos;ll pay in a secure checkout window.</div>
          {autoCheckout && (
            <span hidden>
              <PlanCheckoutButton planId={planIds[autoCheckout.plan]} period={autoCheckout.period} autoOpen>
                Checkout
              </PlanCheckoutButton>
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
