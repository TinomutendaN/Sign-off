"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PLANS } from "@/features/billing/plans";
import { SideCard } from "./SideCard";

type PlanCardProps = {
  /** Active projects in the workspace. */
  projectCount: number;
  /** "free" is passed by the upgrade pop-up (Step 10). */
  variant?: "free";
};

/**
 * TEMPORARY plan card. Step 2 has no billing yet, so the plan is a fixed value:
 * the Free card on /billing (and in the upgrade pop-up), the Pro card everywhere else.
 * TODO(Step 10): read the plan, period, renewal date and usage from Clerk Billing (has() / subscription).
 */
export function PlanCard({ projectCount, variant }: PlanCardProps) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const onBilling = pathname === "/billing";
  const free = variant === "free" || onBilling;
  const freeLimit = PLANS.free.limits.projects ?? 0; // TODO(Step 10): from the Free plan's feature in Clerk

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
          {/* TODO(Step 10): on /billing this starts Clerk checkout for Pro. */}
          <Button href="/billing" size="block">
            Upgrade to Pro
          </Button>
        </>
      ) : (
        <>
          <div className="pr-6 text-[15px] font-medium text-ink">You&apos;re on Pro</div>
          <div className="text-xs text-muted">Annual plan · renews 24 Nov 2027</div>
          <div className="text-xs text-muted">
            {projectCount} {projectCount === 1 ? "project" : "projects"} · no project limit
          </div>
          <Button href="/billing" variant="outline" size="block">
            Manage billing
          </Button>
        </>
      )}
    </SideCard>
  );
}
