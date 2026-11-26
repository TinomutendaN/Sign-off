// Progress, agreed in Step 1. One place, used by the Projects list, the project header,
// the Dashboard, Client home and the client project view.
//
// - An approved milestone counts as 100%.
// - Otherwise a milestone is the average of its tasks: To do 0, In progress 0.5, In review 0.7, Done 1.
// - A project is the average of its milestones.

import type { MilestoneStatus, TaskStatus } from "@/generated/prisma/enums";

export const TASK_WEIGHT: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 0.5,
  IN_REVIEW: 0.7,
  DONE: 1,
};

export type ProgressMilestone = {
  number: number;
  name: string;
  status: MilestoneStatus;
  tasks: { status: TaskStatus }[];
};

/** 0–100, unrounded. */
export function milestoneProgress(milestone: ProgressMilestone): number {
  if (milestone.status === "APPROVED") return 100;
  if (milestone.tasks.length === 0) return 0;
  const total = milestone.tasks.reduce((sum, t) => sum + TASK_WEIGHT[t.status], 0);
  return (total / milestone.tasks.length) * 100;
}

/** 0–100, rounded to a whole percent (Website redesign: 100, 70, 20 → 63). */
export function projectProgress(milestones: ProgressMilestone[]): number {
  if (milestones.length === 0) return 0;
  const total = milestones.reduce((sum, m) => sum + milestoneProgress(m), 0);
  return Math.round(total / milestones.length);
}

/** The first milestone not yet approved, or null when every milestone is approved. */
export function currentMilestone<T extends ProgressMilestone>(milestones: T[]): T | null {
  return [...milestones].sort((a, b) => a.number - b.number).find((m) => m.status !== "APPROVED") ?? null;
}
