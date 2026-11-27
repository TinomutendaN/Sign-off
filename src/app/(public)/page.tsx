import { FlushWindow } from "@/components/frames/FlushWindow";
import { AudienceCards } from "@/features/marketing/components/AudienceCards";
import { ClosingBand } from "@/features/marketing/components/ClosingBand";
import { HowItWorks } from "@/features/marketing/components/HowItWorks";
import { LandingHero } from "@/features/marketing/components/LandingHero";
import { PublicFooter } from "@/features/marketing/components/PublicFooter";

// 01 Landing. No lavender border, by the owner's request: the window fills the screen.
export default function LandingPage() {
  return (
    <>
      <FlushWindow />
      <LandingHero />
      <HowItWorks />
      <AudienceCards />
      <ClosingBand />
      <PublicFooter />
    </>
  );
}
