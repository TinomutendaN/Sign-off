import { db } from "@/lib/db";

/** Counts for the admin side panel: paying subscribers and all active workspaces. */
export async function getAdminSidebarCounts() {
  const [paying, workspaces] = await Promise.all([
    db.subscription.count({ where: { status: "ACTIVE", plan: { not: "FREE" } } }),
    db.subscription.groupBy({ by: ["orgId"], where: { status: "ACTIVE" } }),
  ]);
  return { paying, workspaces: workspaces.length };
}
