import { notFound } from "next/navigation";
import { MilestoneStrip } from "@/features/projects/components/MilestoneStrip";
import { ProjectHeader } from "@/features/projects/components/ProjectHeader";
import { ProjectTabs } from "@/features/projects/components/ProjectTabs";
import { getProjectHeader, projectTeam } from "@/features/projects/queries";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/format";

// Project header, milestone strip and tabs, shared by Board, List, Milestones and Activity.
// Only Owners and Team members of this project's workspace get in; anyone else gets a 404.
export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: React.ReactNode;
}) {
  const { projectId } = await params;
  const { orgId } = await requireRole("MEMBER");
  const [project, members] = await Promise.all([getProjectHeader(projectId, orgId), getMemberDirectory(orgId)]);
  if (!project) notFound();

  const due = project.dueDate ? ` · Due ${longDate(project.dueDate)}` : "";

  return (
    <>
      <ProjectHeader
        projectId={project.id}
        name={project.name}
        subtitle={`${project.client.name}${due}`}
        team={projectTeam(project.tasks, members)}
      />
      <MilestoneStrip milestones={project.milestones} />
      <ProjectTabs projectId={project.id} />
      {children}
    </>
  );
}
