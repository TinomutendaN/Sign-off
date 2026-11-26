import type { MilestoneStatus } from "@/generated/prisma/enums";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { ProgressBar, type BarTone } from "@/components/ui/ProgressBar";
import { milestoneProgress, type ProgressMilestone } from "../progress";

const look: Record<MilestoneStatus, { label: string; pill: PillTone; bar: BarTone }> = {
  APPROVED: { label: "Approved", pill: "green", bar: "green" },
  WAITING: { label: "Waiting on client", pill: "amber", bar: "amber" },
  IN_PROGRESS: { label: "In progress", pill: "progress", bar: "blue" },
  UP_NEXT: { label: "Up next", pill: "white", bar: "idle" },
};

/** The project's milestones as grey boxes, each with a status pill and a progress bar. */
export function MilestoneStrip({ milestones }: { milestones: (ProgressMilestone & { id: string })[] }) {
  if (milestones.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {milestones.map((m) => {
        const l = look[m.status];
        return (
          <div key={m.id} className="flex flex-[1_1_220px] flex-col gap-[9px] rounded-side bg-panel px-[14px] py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-ink">
                {m.number}. {m.name}
              </span>
              <Pill tone={l.pill}>{l.label}</Pill>
            </div>
            <ProgressBar
              value={milestoneProgress(m)}
              tone={l.bar}
              track="white"
              height={5}
              label={`${m.name} progress`}
            />
          </div>
        );
      })}
    </div>
  );
}
