import { PricingPlans } from "@/features/billing/components/PricingPlans";
import { PricingTrustRow } from "@/features/billing/components/PricingTrustRow";

// 02 Pricing. Trimmed from the design (no subline, plan blurbs or FAQ) so it fits on one screen.
export default function PricingPage() {
  return (
    <>
      <PricingPlans />
      <PricingTrustRow />
    </>
  );
}
