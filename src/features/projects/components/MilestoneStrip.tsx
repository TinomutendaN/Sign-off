import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { MilestoneStatus } from "@/generated/prisma/enums";
import type { PillTone } from "@/components/ui/Pill";
import type { BarTone } from "@/components/ui/ProgressBar";
import { MILESTONE_LOOK } from "../milestoneLook";
import { milestoneProgress, type ProgressMilestone } from "../progress";

type Look = Record<MilestoneStatus, { label: string; pill: PillTone; bar: BarTone }>;

/**
 * The project's milestones as grey boxes, each with a status pill and a progress bar.
 * `look` swaps the wording, e.g. the client portal's "Waiting on you".
 */
export function MilestoneStrip({
  milestones,
  look = MILESTONE_LOOK,
}: {
  milestones: (ProgressMilestone & { id: string })[];
  look?: Look;
}) {
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
