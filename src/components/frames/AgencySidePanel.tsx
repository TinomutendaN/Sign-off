import { auth } from "@clerk/nextjs/server";
import { getBillingState, getPlanIds } from "@/features/billing/queries";
import { listSidebarProjects } from "@/features/projects/queries";
import { getWorkspaceSummary } from "@/features/workspaces/queries";
import { nameInitials } from "@/lib/format";
import { PlanCard } from "./PlanCard";
import { SideLink } from "./SideLink";
import { SideSection } from "./SideSection";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

/** Agency side panel data: workspace (Clerk), projects (database), plan card (Clerk Billing). */
export async function AgencySidePanel() {
  const { orgId, has } = await auth();

  // The layout sends people without an active workspace elsewhere; this only shows mid-redirect.
  if (!orgId) {
    return <div className="flex-1 px-2 text-xs text-muted">No workspace selected.</div>;
  }

  const [workspace, projects, billing, planIds] = await Promise.all([
    getWorkspaceSummary(orgId),
    listSidebarProjects(orgId),
    getBillingState(orgId),
    getPlanIds(),
  ]);
  const members = workspace.membersCount;

  return (
    <>
      <WorkspaceSwitcher
        orgId={orgId}
        name={workspace.name}
        initials={nameInitials(workspace.name)}
        subtitle={`Workspace · ${members} ${members === 1 ? "member" : "members"}`}
      />
      <SideSection label="CLIENTS & PROJECTS">
        {projects.map((p) => (
          <SideLink
            key={p.id}
            href={`/projects/${p.id}`}
            match={`/projects/${p.id}`}
            dot={p.colour}
            title={p.name}
            subtitle={p.clientName}
            count={p.taskCount}
          />
        ))}
        {projects.length === 0 && <p className="px-[10px] text-xs text-muted">No projects yet.</p>}
      </SideSection>
      <div className="flex-1" />
      <PlanCard
        billing={billing}
        projectCount={projects.length}
        isOwner={has({ role: "org:admin" })}
        planIds={planIds}
      />
    </>
  );
}
