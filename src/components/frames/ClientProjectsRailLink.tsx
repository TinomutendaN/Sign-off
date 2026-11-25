import { auth } from "@clerk/nextjs/server";
import { KanbanIcon } from "@/components/icons";
import { getFirstPortalProjectId } from "@/features/clients/queries";
import { RailLink } from "./RailLink";

/** The portal's "Projects" menu item opens the client's first project. */
export async function ClientProjectsRailLink() {
  const { userId } = await auth();
  const projectId = userId ? await getFirstPortalProjectId(userId) : null;
  return (
    <RailLink
      href={projectId ? `/portal/projects/${projectId}` : "/portal"}
      icon={<KanbanIcon />}
      label="Projects"
      match={["/portal/projects"]}
    />
  );
}
