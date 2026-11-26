// Words and colours for task statuses, types and deliverable badges. Safe for client components.

import type { DeliverableStatus, TaskStatus, TaskType } from "@/generated/prisma/enums";
import type { PillTone } from "@/components/ui/Pill";

export const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const satisfies readonly TaskStatus[];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export const STATUS_TONE: Record<TaskStatus, PillTone> = {
  TODO: "grey",
  IN_PROGRESS: "progress",
  IN_REVIEW: "amber",
  DONE: "green",
};

export const TYPES = ["DESIGN", "BUILD", "CONTENT", "FIX"] as const satisfies readonly TaskType[];

export const TYPE_LABEL: Record<TaskType, string> = {
  DESIGN: "Design",
  BUILD: "Build",
  CONTENT: "Content",
  FIX: "Fix",
};

/** The type pill in the task panel (Build is the design's pale-blue pill). */
export const TYPE_TONE: Record<TaskType, PillTone> = {
  DESIGN: "amber",
  BUILD: "progress",
  CONTENT: "green",
  FIX: "red",
};

/** The 30×4 tag bar at the top of each card: Design amber, Build blue, Content green, Fix red. */
export const TYPE_TAG: Record<TaskType, string> = {
  DESIGN: "bg-amber",
  BUILD: "bg-blue",
  CONTENT: "bg-green",
  FIX: "bg-red",
};

/** The badge a card shows for the deliverable its work was sent as. */
export const BADGE: Record<DeliverableStatus, { label: string; tone: PillTone }> = {
  WAITING: { label: "Waiting on client", tone: "amber" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "red" },
  APPROVED: { label: "Approved by client", tone: "green" },
};
