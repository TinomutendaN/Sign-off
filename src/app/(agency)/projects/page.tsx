import type { ProjectRowData } from "@/features/projects/components/ProjectRow";
import { ProjectsList } from "@/features/projects/components/ProjectsList";
import { currentMilestone, projectProgress } from "@/features/projects/progress";
import { listProjects, projectTeam } from "@/features/projects/queries";
import { getMemberDirectory, getWorkspaceSummary } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/format";

// 06 Projects list
export default async function ProjectsPage() {
  const { orgId } = await requireRole("MEMBER");
  const [projects, workspace, members] = await Promise.all([
    listProjects(orgId),
    getWorkspaceSummary(orgId),
    getMemberDirectory(orgId),
  ]);

  const rows: ProjectRowData[] = projects.map((p) => {
    const archived = p.status === "ARCHIVED";
    const current = currentMilestone(p.milestones);
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
      milestoneLabel: current
        ? `${current.number}. ${current.name}`
        : p.milestones.length
          ? "All milestones approved"
          : "No milestones yet",
      progress: projectProgress(p.milestones),
      dateLabel: archived ? "Finished" : "Due",
      date: date ? longDate(date) : null,
      team: projectTeam(p.tasks, members),
      kind: archived ? "archived" : p.milestones.some((m) => m.status === "WAITING") ? "waiting" : "active",
    };
  });

  const active = rows.filter((r) => r.kind !== "archived").length;
  const archived = rows.length - active;

  return (
    <ProjectsList projects={rows} subtitle={`${workspace.name} · ${active} active, ${archived} archived`} />
  );
}
