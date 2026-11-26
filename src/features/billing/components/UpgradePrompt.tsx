"use client";

import Link from "next/link";
import { UpgradeStarIcon } from "@/components/icons";
import { Dialog } from "@/components/ui/Dialog";
import { PLANS, periodPrice, type PaidPlanKey } from "../plans";
import { PlanCheckoutButton } from "./PlanCheckoutButton";

type UpgradePromptProps = {
  open: boolean;
  onClose: () => void;
  planIds: Record<PaidPlanKey, string | null>;
};

function planLines(plan: "free" | "pro") {
  const { projects, members, storageGb } = PLANS[plan].limits;
  return [
    projects === null ? "Unlimited projects" : `${projects} projects`,
    `Up to ${members} team members`,
    `${storageGb} GB of files`,
  ];
}

/**
 * 12 Upgrade pop-up: shown instead of creating a third project on Free. Both buttons open
 * Clerk's checkout for Pro (annual or monthly). The pop-up closes first, because a modal
 * dialog would sit on top of Clerk's checkout window.
 */
export function UpgradePrompt({ open, onClose, planIds }: UpgradePromptProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="You've used both Free projects"
      icon={<UpgradeStarIcon />}
      description="To start a third project, upgrade to Pro or archive a project you've finished. Your current work stays exactly as it is."
    >
      <div className="grid grid-cols-2 gap-[10px] phone:grid-cols-1">
        <div className="flex flex-col gap-2 rounded-card bg-soft p-[14px]">
          <span className="text-xs font-semibold text-muted">FREE · NOW</span>
          {planLines("free").map((line) => (
            <span key={line} className="text-[13px] text-ink-2">
              {line}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-card bg-violet-soft p-[14px] outline-2 outline-violet">
          <span className="text-xs font-semibold text-violet-ink">PRO</span>
          {planLines("pro").map((line) => (
            <span key={line} className="text-[13px] font-medium text-ink">
              {line}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-[10px]" onClickCapture={onClose}>
        <PlanCheckoutButton planId={planIds.pro} period="annual" className="flex-[1_1_200px]">
          Upgrade · {periodPrice("pro", "annual")} a year
        </PlanCheckoutButton>
        <PlanCheckoutButton planId={planIds.pro} period="monthly" variant="outline" className="flex-[1_1_140px]">
          Pay monthly · {periodPrice("pro", "monthly")}
        </PlanCheckoutButton>
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <Link href="/projects?archive=1" onClick={onClose} className="font-medium text-violet-icon">
          Archive a project instead
        </Link>
        <button type="button" onClick={onClose} className="text-muted">
          Not now
        </button>
      </div>
    </Dialog>
  );
}
