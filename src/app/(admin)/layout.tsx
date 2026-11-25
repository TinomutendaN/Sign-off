import { Suspense } from "react";
import { AccessGate } from "@/components/frames/AccessGate";
import { AdminFrame } from "@/components/frames/AdminFrame";

// The SIGNoFF admin only (requireAdmin()); others go to their own area.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminFrame>
      <Suspense fallback={null}>
        <AccessGate area="admin">{children}</AccessGate>
      </Suspense>
    </AdminFrame>
  );
}
