import { getPlanIds } from "@/features/billing/queries";
import { ClientsScreen } from "@/features/clients/components/ClientsScreen";
import { listClients } from "@/features/clients/queries";
import { getWorkspaceSummary } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// 05 Clients
export default async function ClientsPage() {
  const { orgId } = await requireRole("MEMBER");
  const [clients, workspace, planIds] = await Promise.all([
    listClients(orgId),
    getWorkspaceSummary(orgId),
    getPlanIds(),
  ]);
  return <ClientsScreen clients={clients} workspaceName={workspace.name} planIds={planIds} />;
}
