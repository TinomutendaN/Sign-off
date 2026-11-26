import { notFound } from "next/navigation";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { getProjectActivity, toActivityLines } from "@/features/activity/queries";
import { getProjectHeader } from "@/features/projects/queries";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// Project Activity tab (no design; styled like the Activity panel on the client project view)
export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { orgId } = await requireRole("MEMBER");
  // All three at once; nothing is shown unless the project is in this workspace.
  const [project, rows, members] = await Promise.all([
    getProjectHeader(projectId, orgId),
    getProjectActivity(projectId),
    getMemberDirectory(orgId),
  ]);
  if (!project) notFound();

  return <ActivityFeed lines={toActivityLines(rows, project.client.name, members)} />;
}
