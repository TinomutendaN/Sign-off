import { Receipt } from "@/features/billing/components/Receipt";
import { getWorkspaceSummary } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// A printable receipt for one payment (Billing → Invoices → Download). Owner only, like Billing.
// Clerk keeps the payment; the browser's "Save as PDF" makes the file.
export default async function ReceiptPage({ params }: PageProps<"/billing/receipts/[paymentId]">) {
  const { orgId } = await requireRole("OWNER");
  const [{ paymentId }, workspace] = await Promise.all([params, getWorkspaceSummary(orgId)]);
  return <Receipt paymentId={paymentId} orgId={orgId} workspaceName={workspace.name} />;
}
