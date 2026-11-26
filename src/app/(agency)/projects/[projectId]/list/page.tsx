import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProjectHeader } from "@/features/projects/queries";
import { toPeople } from "@/features/tasks/board";
import { TaskTable } from "@/features/tasks/components/TaskTable";
import { TaskPanelSlot } from "@/features/tasks/components/TaskPanelSlot";
import { getProjectTasks } from "@/features/tasks/queries";
import { toBoardTasks } from "@/features/tasks/toBoardTasks";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// Project List tab (no design; styled like the Subscribers table). ?task=id opens 08 Task detail.
export default async function ListPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { projectId } = await params;
  const { orgId, userId } = await requireRole("MEMBER");
  // All three at once; nothing is shown unless the project is in this workspace.
  const [project, rows, members] = await Promise.all([
    getProjectHeader(projectId, orgId),
    getProjectTasks(projectId),
    getMemberDirectory(orgId),
  ]);
  if (!project) notFound();

  return (
    <>
      <TaskTable projectId={projectId} tasks={toBoardTasks(rows)} people={toPeople(members)} />
      {/* ?task=id opens the task panel over this tab; the table never waits for it. */}
      <Suspense fallback={null}>
        <TaskPanelSlot searchParams={searchParams} projectId={projectId} orgId={orgId} userId={userId} />
      </Suspense>
    </>
  );
}
