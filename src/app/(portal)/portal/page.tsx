import { currentUser } from "@clerk/nextjs/server";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { FilePreview } from "@/features/deliverables/components/FilePreview";
import { ApprovalSummaryCard } from "@/features/portal/components/ApprovalSummaryCard";
import { PortalProjectCard } from "@/features/portal/components/PortalProjectCard";
import { PortalSection } from "@/features/portal/components/PortalSection";
import { getPortalHome } from "@/features/portal/queries";
import { sentLine, toClientActivityLines } from "@/features/portal/wording";
import { projectProgress } from "@/features/projects/progress";
import { requireClient } from "@/lib/auth";
import { firstName, longDate } from "@/lib/format";

// 11 Client home
export default async function PortalHomePage() {
  const { userId } = await requireClient();
  const [data, user] = await Promise.all([getPortalHome(userId), currentUser()]);
  // requireClient() has checked there is at least one shared project; this only guards a race.
  if (!data) return null;

  const { projects, activity, agencyByOrg } = data;
  const clientName = projects[0].client.name;
  const agency = agencyByOrg.get(projects[0].orgId)!;

  const waiting = projects
    .flatMap((p) =>
      p.milestones.flatMap((m) => m.deliverables.filter((d) => d.status === "WAITING").map((d) => ({ project: p, d }))),
    )
    .sort((a, b) => b.d.sentAt.getTime() - a.d.sentAt.getTime());

  return (
    <>
      <div className="flex flex-wrap items-center gap-[14px]">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
          <div className="text-xs text-muted">
            {clientName} · Shared with you by {agency.name}
          </div>
          <h1 className="m-0 text-[26px] font-medium tracking-[-0.01em] text-ink">
            Welcome back, {firstName(user ?? {})}
          </h1>
        </div>
        <NotificationBell />
      </div>

      <PortalSection
        title="Needs your approval"
        aside={
          waiting.length > 0 && (
            <span className="rounded-full bg-amber-tint px-2 py-[3px] text-xs font-semibold text-amber-ink">
              {waiting.length}
            </span>
          )
        }
      >
        {waiting.map(({ project, d }) => (
          <ApprovalSummaryCard
            key={d.id}
            href={`/portal/projects/${project.id}`}
            title={d.title}
            meta={`${project.name} · ${sentLine(d, agencyByOrg.get(project.orgId)?.members ?? [])}`}
            note={d.note}
            thumbnail={
              <FilePreview
                variant="thumb"
                title={d.title}
                fileName={d.fileName}
                fileUrl={d.fileUrl}
                size={d.size}
                previewUrl={d.previewUrl}
              />
            }
          />
        ))}
        {waiting.length === 0 && (
          <div className="rounded-card bg-card p-4 text-[13px] text-muted shadow-card">
            Nothing needs your approval right now.
          </div>
        )}
      </PortalSection>

      <div className="flex flex-wrap items-start gap-[14px]">
        <PortalSection
          title="Your projects"
          aside={<span className="text-xs text-muted">{projects.length}</span>}
          className="flex-[999_1_520px]"
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[10px]">
            {projects.map((p) => (
              <PortalProjectCard
                key={p.id}
                href={`/portal/projects/${p.id}`}
                name={p.name}
                colour={p.colour}
                due={p.dueDate ? longDate(p.dueDate) : null}
                progress={projectProgress(p.milestones)}
                milestones={p.milestones.map((m) => ({ id: m.id, label: `${m.number}. ${m.name}`, status: m.status }))}
              />
            ))}
          </div>
        </PortalSection>
        <ActivityFeed
          title="Latest updates"
          compact
          lines={toClientActivityLines(activity, userId, clientName, agency)}
          className="min-w-0 flex-[1_1_300px] max-w-[380px] tablet:max-w-none"
        />
      </div>
    </>
  );
}
