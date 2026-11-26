import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MILESTONE_LOOK } from "@/features/projects/milestoneLook";
import { milestoneProgress } from "@/features/projects/progress";
import type { Member } from "@/features/workspaces/queries";
import { shortDate } from "@/lib/format";
import type { MilestoneWithDeliverables } from "../queries";
import { DeliverableRow } from "./DeliverableRow";

/** "Due 18 Nov · Approved 18 Nov" */
function metaLine(m: MilestoneWithDeliverables): string {
  const parts = [];
  if (m.dueDate) parts.push(`Due ${shortDate(m.dueDate)}`);
  if (m.status === "APPROVED" && m.approvedAt) parts.push(`Approved ${shortDate(m.approvedAt)}`);
  return parts.join(" · ");
}

/** A grey milestone panel: title, status, due note, progress and its deliverables. */
export function MilestoneSection({
  milestone: m,
  previous,
  clientName,
  members,
  now,
}: {
  milestone: MilestoneWithDeliverables;
  previous: MilestoneWithDeliverables | null;
  clientName: string;
  members: Member[];
  now: Date;
}) {
  const look = MILESTONE_LOOK[m.status];
  const waitingOn = previous && previous.status !== "APPROVED" ? previous : null;

  return (
    <section className="flex flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px]">
      <div className="flex flex-wrap items-center gap-3 px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">
          {m.number}. {m.name}
        </h2>
        <Pill tone={look.pill}>{look.label}</Pill>
        <span className="flex-1" />
        <span className="text-xs text-muted">{metaLine(m)}</span>
        <ProgressBar
          value={milestoneProgress(m)}
          tone={look.bar}
          track="white"
          height={5}
          className="w-[120px]"
          label={`${m.name} progress`}
        />
      </div>

      {m.deliverables.map((d) => (
        <DeliverableRow key={d.id} deliverable={d} clientName={clientName} members={members} now={now} />
      ))}

      {m.deliverables.length === 0 && (
        <div className="rounded-card border-[1.5px] border-dashed border-line-dash p-[14px] text-center text-[13px] text-muted">
          No deliverables yet.
          {waitingOn && ` Work starts after ${waitingOn.name.toLowerCase()} are approved.`}
        </div>
      )}
    </section>
  );
}
