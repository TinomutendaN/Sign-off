import { FlushWindow } from "@/components/frames/FlushWindow";
import { PricingPlans } from "@/features/billing/components/PricingPlans";
import { PricingTrustRow } from "@/features/billing/components/PricingTrustRow";
import { getPlanIds } from "@/features/billing/queries";

// 02 Pricing. Trimmed from the design on request (no lavender margin, label, subline,
// plan blurbs or FAQ) so it fits on one screen.
export default async function PricingPage() {
  const planIds = await getPlanIds();
  return (
    <>
      <FlushWindow />
      <PricingPlans planIds={planIds} />
      <PricingTrustRow />
    </>
  );
}
