import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TabSkeleton } from "@/features/projects/components/TabSkeleton";
import { getProjectHeader } from "@/features/projects/queries";
import { toPeople } from "@/features/tasks/board";
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard";
import { TaskPanelSlot } from "@/features/tasks/components/TaskPanelSlot";
import { getProjectTasks } from "@/features/tasks/queries";
import { toBoardTasks } from "@/features/tasks/toBoardTasks";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// 07 Board (?task=id opens 08 Task detail)
async function BoardPageContent({
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
      <KanbanBoard projectId={projectId} tasks={toBoardTasks(rows)} people={toPeople(members)} />
      {/* ?task=id opens the task panel over this tab; the board never waits for it. */}
      <Suspense fallback={null}>
        <TaskPanelSlot searchParams={searchParams} projectId={projectId} orgId={orgId} userId={userId} />
      </Suspense>
    </>
  );
}

// The page streams in under its own boundary, so a click shows the skeleton straight away.
export default function BoardPage(props: Parameters<typeof BoardPageContent>[0]) {
  return (
    <Suspense fallback={<TabSkeleton />}>
      <BoardPageContent {...props} />
    </Suspense>
  );
}
