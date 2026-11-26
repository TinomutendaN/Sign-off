import { notFound } from "next/navigation";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { getProjectActivity } from "@/features/activity/queries";
import { getProjectHeader } from "@/features/projects/queries";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// Project Activity tab (no design; styled like the Activity panel on the client project view)
export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { orgId } = await requireRole("MEMBER");
  const project = await getProjectHeader(projectId, orgId);
  if (!project) notFound();

  const members = await getMemberDirectory(orgId);
  const lines = await getProjectActivity(projectId, project.client.name, members);

  return <ActivityFeed lines={lines} />;
}
