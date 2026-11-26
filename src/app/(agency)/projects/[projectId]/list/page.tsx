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
  const project = await getProjectHeader(projectId, orgId);
  if (!project) notFound();

  const [rows, members] = await Promise.all([getProjectTasks(projectId), getMemberDirectory(orgId)]);

  return <TaskTable projectId={projectId} tasks={toBoardTasks(rows)} people={toPeople(members)} />;
}
