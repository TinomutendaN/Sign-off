import { auth } from "@clerk/nextjs/server";
import { listSidebarProjects } from "@/features/projects/queries";
import { getWorkspaceSummary } from "@/features/workspaces/queries";
import { nameInitials } from "@/lib/format";
import { PlanCard } from "./PlanCard";
import { SideLink } from "./SideLink";
import { SideSection } from "./SideSection";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

/** Agency side panel data: workspace (Clerk), projects (database), plan card. */
export async function AgencySidePanel() {
  const { orgId } = await auth();

  // Step 3 redirects people without a workspace; until then show a neutral state.
  if (!orgId) {
    return <div className="flex-1 px-2 text-xs text-muted">No workspace selected.</div>;
  }

  const [workspace, projects] = await Promise.all([getWorkspaceSummary(orgId), listSidebarProjects(orgId)]);
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
      <PlanCard projectCount={projects.length} />
    </>
  );
}
