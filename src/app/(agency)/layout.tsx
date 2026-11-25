import { Suspense } from "react";
import { AccessGate } from "@/components/frames/AccessGate";
import { AgencyFrame } from "@/components/frames/AgencyFrame";

// Owners and Team members only (requireRole("MEMBER")); others go to their own area.
export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgencyFrame>
      <Suspense fallback={null}>
        <AccessGate area="agency">{children}</AccessGate>
      </Suspense>
    </AgencyFrame>
  );
}
