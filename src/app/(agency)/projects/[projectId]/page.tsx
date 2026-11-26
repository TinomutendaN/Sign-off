import { notFound } from "next/navigation";
import { getProjectHeader } from "@/features/projects/queries";
import { toPeople } from "@/features/tasks/board";
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard";
import { getProjectTasks } from "@/features/tasks/queries";
import { toBoardTasks } from "@/features/tasks/toBoardTasks";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// 07 Board (?task=id opens 08 Task detail in Step 6)
export default async function BoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { orgId } = await requireRole("MEMBER");
  // All three at once; nothing is shown unless the project is in this workspace.
  const [project, rows, members] = await Promise.all([
    getProjectHeader(projectId, orgId),
    getProjectTasks(projectId),
    getMemberDirectory(orgId),
  ]);
  if (!project) notFound();

  return <KanbanBoard projectId={projectId} tasks={toBoardTasks(rows)} people={toPeople(members)} />;
}
