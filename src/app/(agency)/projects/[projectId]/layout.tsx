import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MilestoneStrip } from "@/features/projects/components/MilestoneStrip";
import { ProjectHeader } from "@/features/projects/components/ProjectHeader";
import { ProjectHeaderSkeleton } from "@/features/projects/components/ProjectHeaderSkeleton";
import { ProjectTabs } from "@/features/projects/components/ProjectTabs";
import { getProjectHeader, projectTeam } from "@/features/projects/queries";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/format";

type Params = Promise<{ projectId: string }>;

// Project header, milestone strip and tabs, shared by Board, List, Milestones and Activity.
// Only Owners and Team members of this project's workspace get in; anyone else gets a 404.
// The header streams in under its own boundary, so opening a project shows its skeleton at once;
// each tab page does the same check and streams under its own boundary too.
export default function ProjectLayout({ params, children }: { params: Params; children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<ProjectHeaderSkeleton />}>
        <ProjectTop params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function ProjectTop({ params }: { params: Params }) {
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
    </>
  );
}
