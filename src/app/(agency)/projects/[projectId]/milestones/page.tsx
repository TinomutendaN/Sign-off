import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddDeliverablePanel } from "@/features/deliverables/components/AddDeliverablePanel";
import { MilestoneSection } from "@/features/deliverables/components/MilestoneSection";
import { uploadLimitBytes, uploadPrefix } from "@/features/deliverables/files";
import { getMilestoneDeliverables } from "@/features/deliverables/queries";
import { TabSkeleton } from "@/features/projects/components/TabSkeleton";
import { currentMilestone } from "@/features/projects/progress";
import { getProjectHeader } from "@/features/projects/queries";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// 07 Milestones + send for approval. The project header and tabs come from the layout.
// ?replace={deliverableId} ("Upload new version") opens the panel prefilled.
async function MilestonesPageContent({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { orgId } = await requireRole("MEMBER");
  const [project, milestones, members] = await Promise.all([
    getProjectHeader(projectId, orgId),
    getMilestoneDeliverables(projectId),
    getMemberDirectory(orgId),
  ]);
  if (!project) notFound();

  const now = new Date();
  const clientName = project.client.name;
  const open = milestones.filter((m) => m.status !== "APPROVED");
  const replaceable = milestones.flatMap((m) =>
    m.deliverables
      .filter((d) => d.status === "CHANGES_REQUESTED")
      .map((d) => ({ id: d.id, title: d.title, milestoneId: m.id })),
  );

  return (
    <div className="flex flex-wrap items-start gap-[14px]">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[14px]">
        {milestones.map((m, i) => (
          <MilestoneSection
            key={m.id}
            milestone={m}
            previous={milestones[i - 1] ?? null}
            clientName={clientName}
            members={members}
            now={now}
          />
        ))}
        {milestones.length === 0 && (
          <div className="rounded-card border-[1.5px] border-dashed border-line-dash p-[14px] text-center text-[13px] text-muted">
            This project has no milestones yet.
          </div>
        )}
      </div>
      <AddDeliverablePanel
        projectId={projectId}
        clientName={clientName}
        milestones={open.map((m) => ({ id: m.id, label: `${m.number}. ${m.name}` }))}
        defaultMilestoneId={currentMilestone(milestones)?.id ?? null}
        uploadFolder={uploadPrefix(orgId, projectId)}
        limitBytes={uploadLimitBytes(orgId)}
        replaceable={replaceable}
      />
    </div>
  );
}

// The page streams in under its own boundary, so a click shows the skeleton straight away.
export default function MilestonesPage(props: Parameters<typeof MilestonesPageContent>[0]) {
  return (
    <Suspense fallback={<TabSkeleton />}>
      <MilestonesPageContent {...props} />
    </Suspense>
  );
}
