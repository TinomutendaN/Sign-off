import { PricingFaq } from "@/features/billing/components/PricingFaq";
import { PricingPlans } from "@/features/billing/components/PricingPlans";
import { PricingTrustRow } from "@/features/billing/components/PricingTrustRow";

// 02 Pricing
export default function PricingPage() {
  return (
    <>
      <PricingPlans />
      <PricingTrustRow />
      <PricingFaq />
    </>
  );
}
