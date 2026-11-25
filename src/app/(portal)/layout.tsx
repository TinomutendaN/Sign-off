import { Suspense } from "react";
import { AccessGate } from "@/components/frames/AccessGate";
import { ClientFrame } from "@/components/frames/ClientFrame";

// Clients only (requireClient()); others go to their own area.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientFrame>
      <Suspense fallback={null}>
        <AccessGate area="portal">{children}</AccessGate>
      </Suspense>
    </ClientFrame>
  );
}
