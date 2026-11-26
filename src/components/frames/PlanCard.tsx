"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PlanCheckoutButton } from "@/features/billing/components/PlanCheckoutButton";
import { PLANS, type PaidPlanKey } from "@/features/billing/plans";
import type { BillingState } from "@/features/billing/queries";
import { longDate } from "@/lib/format";
import { SideCard } from "./SideCard";

type PlanCardProps = {
  billing: BillingState;
  /** Active projects in the workspace. */
  projectCount: number;
  /** Only Owners can open Billing, so only they get its buttons. */
  isOwner: boolean;
  planIds: Record<PaidPlanKey, string | null>;
};

/**
 * The side panel's plan card, from Clerk Billing. Free: projects used and "Upgrade to Pro"
 * (checkout straight away on /billing, a link to /billing elsewhere). Paid: plan, period and
 * renewal date, and "Manage billing".
 */
export function PlanCard({ billing, projectCount, isOwner, planIds }: PlanCardProps) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const onBilling = pathname === "/billing";
  const free = billing.plan === "free";
  const freeLimit = PLANS.free.limits.projects ?? 0;
  const period = billing.period === "annual" ? "Annual" : "Monthly";
  const when = billing.cancelled
    ? billing.endsAt && `ends ${longDate(new Date(billing.endsAt))}`
    : billing.renewsAt && `renews ${longDate(new Date(billing.renewsAt))}`;

  return (
    <SideCard>
      <button
        type="button"
        aria-label="Close"
        onClick={() => setHidden(true)}
        className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-lg text-muted"
      >
        <CloseIcon />
      </button>
      {free ? (
        <>
          <div className="pr-6 text-[15px] font-medium text-ink">You&apos;re on the Free plan</div>
          <div className="text-xs text-muted">
            {Math.min(projectCount, freeLimit)} of {freeLimit} projects used
          </div>
          <ProgressBar
            value={(projectCount / freeLimit) * 100}
            tone={onBilling ? "violet-bar" : "amber"}
            label="Projects used"
          />
          {isOwner &&
            (onBilling ? (
              <PlanCheckoutButton planId={planIds.pro} period="annual" size="block">
                Upgrade to Pro
              </PlanCheckoutButton>
            ) : (
              <Button href="/billing" size="block">
                Upgrade to Pro
              </Button>
            ))}
        </>
      ) : (
        <>
          <div className="pr-6 text-[15px] font-medium text-ink">You&apos;re on {PLANS[billing.plan].name}</div>
          <div className="text-xs text-muted">
            {period} plan{when ? ` · ${when}` : ""}
          </div>
          <div className="text-xs text-muted">
            {projectCount} {projectCount === 1 ? "project" : "projects"} · no project limit
          </div>
          {isOwner && (
            <Button href="/billing" variant="outline" size="block">
              Manage billing
            </Button>
          )}
        </>
      )}
    </SideCard>
  );
}
