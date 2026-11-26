import { notFound } from "next/navigation";
import { getProjectHeader } from "@/features/projects/queries";
import { toPeople } from "@/features/tasks/board";
import { TaskTable } from "@/features/tasks/components/TaskTable";
import { getProjectTasks } from "@/features/tasks/queries";
import { toBoardTasks } from "@/features/tasks/toBoardTasks";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// Project List tab (no design; styled like the Subscribers table)
export default async function ListPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { orgId } = await requireRole("MEMBER");
  // All three at once; nothing is shown unless the project is in this workspace.
  const [project, rows, members] = await Promise.all([
    getProjectHeader(projectId, orgId),
    getProjectTasks(projectId),
    getMemberDirectory(orgId),
  ]);
  if (!project) notFound();

  return <TaskTable projectId={projectId} tasks={toBoardTasks(rows)} people={toPeople(members)} />;
}
