import { connection } from "next/server";
import { getAdminSidebarCounts } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { SideLink } from "./SideLink";
import { SideSection } from "./SideSection";

/** Admin side panel links with live counts from the Subscription table. */
export async function AdminSidePanel() {
  await connection(); // live numbers: read at request time, never prerendered
  await requireAdmin(); // the counts are admin-only, even while the page redirects
  const { paying, workspaces } = await getAdminSidebarCounts();
  return (
    <SideSection label="ADMIN">
      <SideLink href="/admin" match="/admin" exact dot="violet" title="Overview" />
      <SideLink href="/admin/subscribers" match="/admin/subscribers" dot="green" title="Subscribers" count={paying} />
      <SideLink href="#" dot="blue" title="Workspaces" count={workspaces} />
      <SideLink href="#" dot="amber" title="Plans & prices" />
      <SideLink href="#" dot="idle" title="Payment events" />
    </SideSection>
  );
}
