import type { MilestoneStatus } from "@/generated/prisma/enums";
import type { PillTone } from "@/components/ui/Pill";
import type { BarTone } from "@/components/ui/ProgressBar";

/** A milestone status's pill words and colours, and its progress bar colour. */
export const MILESTONE_LOOK: Record<MilestoneStatus, { label: string; pill: PillTone; bar: BarTone }> = {
  APPROVED: { label: "Approved", pill: "green", bar: "green" },
  WAITING: { label: "Waiting on client", pill: "amber", bar: "amber" },
  IN_PROGRESS: { label: "In progress", pill: "progress", bar: "blue" },
  UP_NEXT: { label: "Up next", pill: "white", bar: "idle" },
};
