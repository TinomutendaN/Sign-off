import { ScreenPlaceholder } from "@/components/frames/ScreenPlaceholder";
import { requireRole } from "@/lib/auth";

// 10 Billing (only the workspace owner can see this page)
export default async function BillingPage() {
  await requireRole("OWNER");
  return <ScreenPlaceholder title="Billing" step={10} />;
}
