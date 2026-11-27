import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/frames/PageSkeleton";
import { MonitorIcon } from "@/components/icons";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Section } from "@/components/ui/Section";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { FilePreview } from "@/features/deliverables/components/FilePreview";
import { downloadHref } from "@/features/deliverables/files";
import { ApprovalCard } from "@/features/portal/components/ApprovalCard";
import { EarlierDeliverableRow } from "@/features/portal/components/EarlierDeliverableRow";
import { getPortalProject } from "@/features/portal/queries";
import { CLIENT_MILESTONE_LOOK, decidedLine, sentLine, toClientActivityLines } from "@/features/portal/wording";
import { MilestoneStrip } from "@/features/projects/components/MilestoneStrip";
import { projectProgress } from "@/features/projects/progress";
import type { DecisionKind } from "@/generated/prisma/enums";
import { requireClient } from "@/lib/auth";
import { fileSize, longDate } from "@/lib/format";

// 12 Client project view. ?decided={deliverableId} keeps a just-decided deliverable in
// "Needs your approval" with its confirmation, in place of the buttons.
async function ClientProjectPageContent({ params, searchParams }: PageProps<"/portal/projects/[projectId]">) {
  const { projectId } = await params;
  const { decided } = await searchParams;
  const { userId } = await requireClient(projectId);
  const data = await getPortalProject(userId, projectId);
  if (!data) redirect("/portal");

  const { project, activity, agency } = data;
  const clientName = project.client.name;
  const progress = projectProgress(project.milestones);

  const all = project.milestones.flatMap((m) => m.deliverables.map((d) => ({ m, d })));
  const decidedId = typeof decided === "string" ? decided : null;
  const justDecided = all.find((x) => x.d.id === decidedId && x.d.status !== "WAITING");
  const toReview = [...(justDecided ? [justDecided] : []), ...all.filter((x) => x.d.status === "WAITING")];
  const earlier = all
    .filter((x) => x.d.status !== "WAITING" && x.d !== justDecided?.d)
    .sort(
      (a, b) =>
        (b.d.decisions[0]?.createdAt ?? b.d.sentAt).getTime() - (a.d.decisions[0]?.createdAt ?? a.d.sentAt).getTime(),
    );

  const reviewMilestones = [...new Set(toReview.map((x) => x.m))];
  const single = reviewMilestones.length === 1 ? reviewMilestones[0] : null;

  return (
    <>
      <ScreenHeader
        icon={<MonitorIcon size={22} />}
        title={project.name}
        subtitle={`Shared with you by ${agency.name}${project.dueDate ? ` · Due ${longDate(project.dueDate)}` : ""}`}
      >
        <div className="flex items-center gap-[14px] phone:w-full">
          <div className="flex w-[200px] flex-col gap-1.5 phone:flex-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Overall progress</span>
              <span className="font-semibold text-ink">{progress}%</span>
            </div>
            <ProgressBar value={progress} track="panel" height={6} label="Overall progress" />
          </div>
          <NotificationBell />
        </div>
      </ScreenHeader>

      <MilestoneStrip milestones={project.milestones} look={CLIENT_MILESTONE_LOOK} />

      <div className="flex flex-wrap items-start gap-[14px]">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-[14px]">
          <Section
            title="Needs your approval"
            aside={
              single && (
                <span className="text-xs text-muted">
                  Milestone {single.number} · {single.name}
                </span>
              )
            }
          >
            {toReview.map(({ m, d }) => (
              <div key={d.id} className="flex flex-col gap-1.5">
                {!single && (
                  <span className="px-2 text-xs text-muted">
                    Milestone {m.number} · {m.name}
                  </span>
                )}
                <ApprovalCard
                  projectId={project.id}
                  deliverableId={d.id}
                  title={d.title}
                  fileLine={`${d.fileName} · ${fileSize(d.size)} · ${sentLine(d, agency.members)}`}
                  note={d.note}
                  fileName={d.fileName}
                  downloadHref={downloadHref(d.fileUrl)}
                  agencyName={agency.name}
                  decided={d.status === "WAITING" ? null : (d.status as DecisionKind)}
                  preview={
                    <FilePreview
                      title={d.title}
                      fileName={d.fileName}
                      fileUrl={d.fileUrl}
                      size={d.size}
                      previewUrl={d.previewUrl}
                    />
                  }
                />
              </div>
            ))}
            {toReview.length === 0 && (
              <div className="rounded-card bg-card p-4 text-[13px] text-muted shadow-card">
                Nothing needs your approval right now.
              </div>
            )}
          </Section>

          <Section title="Earlier deliverables" aside={<span className="text-xs text-muted">{earlier.length}</span>}>
            {earlier.map(({ d }) => (
              <EarlierDeliverableRow
                key={d.id}
                title={d.title}
                meta={decidedLine(d)}
                status={d.status}
                fileName={d.fileName}
                downloadHref={downloadHref(d.fileUrl)}
              />
            ))}
            {earlier.length === 0 && (
              <div className="rounded-card bg-card p-4 text-[13px] text-muted shadow-card">No earlier deliverables yet.</div>
            )}
          </Section>
        </div>

        <ActivityFeed
          lines={toClientActivityLines(activity, userId, clientName, agency)}
          className="box-border min-w-0 flex-[1_1_300px] max-w-[360px] tablet:max-w-none"
        />
      </div>
    </>
  );
}

// The page streams in under its own boundary, so a click shows the skeleton straight away.
export default function ClientProjectPage(props: Parameters<typeof ClientProjectPageContent>[0]) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClientProjectPageContent {...props} />
    </Suspense>
  );
}
