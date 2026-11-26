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
  const project = await getProjectHeader(projectId, orgId);
  if (!project) notFound();

  const [rows, members] = await Promise.all([getProjectTasks(projectId), getMemberDirectory(orgId)]);

  return <KanbanBoard projectId={projectId} tasks={toBoardTasks(rows)} people={toPeople(members)} />;
}
