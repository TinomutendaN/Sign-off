import { AudienceCards } from "@/features/marketing/components/AudienceCards";
import { ClosingBand } from "@/features/marketing/components/ClosingBand";
import { HowItWorks } from "@/features/marketing/components/HowItWorks";
import { LandingHero } from "@/features/marketing/components/LandingHero";
import { PublicFooter } from "@/features/marketing/components/PublicFooter";

// 01 Landing
export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <HowItWorks />
      <AudienceCards />
      <ClosingBand />
      <PublicFooter />
    </>
  );
}
