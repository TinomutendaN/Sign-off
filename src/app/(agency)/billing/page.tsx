import { Suspense } from "react";
import { PageSkeleton } from "@/components/frames/PageSkeleton";
import { BillingIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { BillingNotice } from "@/features/billing/components/BillingNotice";
import { BillingSection } from "@/features/billing/components/BillingSection";
import { CurrentPlanCard } from "@/features/billing/components/CurrentPlanCard";
import { InvoicesCard } from "@/features/billing/components/InvoicesCard";
import { PaymentMethodCard } from "@/features/billing/components/PaymentMethodCard";
import { UsageCard } from "@/features/billing/components/UsageCard";
import { PAID_PLANS, PERIODS, PLANS, type PaidPlanKey, type Period } from "@/features/billing/plans";
import { countActiveProjects, getBillingState, getPlanIds, storageUsed } from "@/features/billing/queries";
import { isDemoOrg } from "@/features/workspaces/demo";
import { getWorkspaceSummary } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

/** ?checkout=pro&period=annual, sent here after sign-up with a plan chosen on Pricing. */
function chosenCheckout(plan: unknown, period: unknown): { plan: PaidPlanKey; period: Period } | null {
  const p = PAID_PLANS.find((key) => key === plan);
  const per = PERIODS.find((key) => key === period) ?? "annual";
  return p ? { plan: p, period: per } : null;
}

// 10 Billing (only the workspace owner can see this page)
async function BillingPageContent({ searchParams }: PageProps<"/billing">) {
  const { orgId } = await requireRole("OWNER");
  const { checkout, period } = await searchParams;

  const [billing, workspace, planIds, projects, storageBytes] = await Promise.all([
    getBillingState(orgId),
    getWorkspaceSummary(orgId),
    getPlanIds(),
    countActiveProjects(orgId),
    storageUsed(orgId),
  ]);
  const free = billing.plan === "free";
  const projectLimit = PLANS.free.limits.projects ?? 0;

  return (
    <>
      <ScreenHeader
        icon={<BillingIcon size={22} />}
        title="Billing"
        subtitle={`${workspace.name} · Only the workspace owner can see this page`}
      >
        <Button href="/pricing" variant="outline">
          Compare plans
        </Button>
      </ScreenHeader>

      {free && projects >= projectLimit && <BillingNotice kind="limit" />}
      {!free && <BillingNotice kind="paid" planName={PLANS[billing.plan].name} demo={isDemoOrg(orgId)} />}

      <div className="flex flex-wrap items-stretch gap-[14px]">
        <BillingSection title="Current plan" className="flex-[1_1_420px]">
          <CurrentPlanCard
            billing={billing}
            planIds={planIds}
            autoCheckout={free ? chosenCheckout(checkout, period) : null}
          />
        </BillingSection>
        <BillingSection title="Usage" className="flex-[1_1_360px]">
          <UsageCard
            plan={billing.plan}
            projects={projects}
            members={workspace.membersCount}
            storageBytes={storageBytes}
          />
        </BillingSection>
      </div>

      <div className="flex flex-wrap items-start gap-[14px]">
        <BillingSection title="Payment method" className="max-w-[420px] flex-[1_1_300px] tablet:max-w-none">
          <PaymentMethodCard />
        </BillingSection>
        <BillingSection title="Invoices" className="flex-[999_1_420px]">
          <InvoicesCard />
        </BillingSection>
      </div>
    </>
  );
}

// The page streams in under its own boundary, so a click shows the skeleton straight away.
export default function BillingPage(props: Parameters<typeof BillingPageContent>[0]) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BillingPageContent {...props} />
    </Suspense>
  );
}
