import { Suspense } from "react";
import { PageSkeleton } from "@/components/frames/PageSkeleton";
import { getPlanIds, projectLimitReached } from "@/features/billing/queries";
import type { ProjectRowData } from "@/features/projects/components/ProjectRow";
import { ProjectsList } from "@/features/projects/components/ProjectsList";
import { milestoneLabel, projectKind, projectProgress } from "@/features/projects/progress";
import { listProjects, projectTeam } from "@/features/projects/queries";
import { getMemberDirectory, getWorkspaceSummary } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/format";

// 06 Projects list. On Free with both projects in use, "+ New project" opens the upgrade pop-up (12).
// ?archive=1 (from the pop-up's "Archive a project instead") shows Archive buttons to Owners.
async function ProjectsPageContent({ searchParams }: PageProps<"/projects">) {
  const { orgId, isOwner } = await requireRole("MEMBER");
  const { archive } = await searchParams;
  const [projects, workspace, members, limitReached, planIds] = await Promise.all([
    listProjects(orgId),
    getWorkspaceSummary(orgId),
    getMemberDirectory(orgId),
    projectLimitReached(orgId),
    getPlanIds(),
  ]);

  const rows: ProjectRowData[] = projects.map((p) => {
    const archived = p.status === "ARCHIVED";
    const finishedAt = p.milestones.reduce<Date | null>(
      (latest, m) => (m.approvedAt && (!latest || m.approvedAt > latest) ? m.approvedAt : latest),
      null,
    );
    const date = archived ? (finishedAt ?? p.dueDate) : p.dueDate;
    return {
      id: p.id,
      name: p.name,
      clientName: p.client.name,
      colour: archived ? "idle" : p.colour,
      milestoneLabel: milestoneLabel(p.milestones),
      progress: projectProgress(p.milestones),
      dateLabel: archived ? "Finished" : "Due",
      date: date ? longDate(date) : null,
      team: projectTeam(p.tasks, members),
      kind: projectKind(p),
    };
  });

  const active = rows.filter((r) => r.kind !== "archived").length;
  const archived = rows.length - active;

  return (
    <ProjectsList
      projects={rows}
      subtitle={`${workspace.name} · ${active} active, ${archived} archived`}
      limitReached={limitReached}
      planIds={planIds}
      archiveMode={archive === "1"}
      canArchive={isOwner}
    />
  );
}

// The page streams in under its own boundary, so a click shows the skeleton straight away.
export default function ProjectsPage(props: Parameters<typeof ProjectsPageContent>[0]) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProjectsPageContent {...props} />
    </Suspense>
  );
}
