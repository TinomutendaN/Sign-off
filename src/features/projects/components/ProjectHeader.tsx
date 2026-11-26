import { ExternalLinkIcon, MonitorIcon, PlusIcon, StarIcon } from "@/components/icons";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import type { Member } from "@/features/workspaces/queries";

type ProjectHeaderProps = {
  projectId: string;
  name: string;
  subtitle: string;
  team: Member[];
};

/** Project title, client and due date, team, bell, "Client view" and "+ New task". */
export function ProjectHeader({ projectId, name, subtitle, team }: ProjectHeaderProps) {
  return (
    <ScreenHeader
      icon={<MonitorIcon />}
      title={name}
      afterTitle={<StarIcon className="shrink-0 text-muted" />}
      subtitle={subtitle}
    >
      <div className="flex flex-wrap items-center gap-[14px]">
        <AvatarStack people={team} size={32} />
        <NotificationBell />
        {/* No agency-side design for the client's view yet, so it's shown but inactive. */}
        <Button variant="outline" icon={<ExternalLinkIcon />} disabled title="Coming soon">
          Client view
        </Button>
        <Button href={`/projects/${projectId}?add=TODO`} scroll={false} icon={<PlusIcon />}>
          New task
        </Button>
      </div>
    </ScreenHeader>
  );
}
