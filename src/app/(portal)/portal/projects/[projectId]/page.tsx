import { ScreenPlaceholder } from "@/components/frames/ScreenPlaceholder";
import { requireClient } from "@/lib/auth";

// 12 Client project view
export default async function ClientProjectPage({ params }: PageProps<"/portal/projects/[projectId]">) {
  const { projectId } = await params;
  await requireClient(projectId);
  return <ScreenPlaceholder title="Client project view" step={8} />;
}
