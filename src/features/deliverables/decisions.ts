// What a client's decision does to the rest of the project. Agreed in Step 8.
//
// Milestone (strict): worked out again from its current deliverables after every decision.
//   - every current deliverable approved → Approved
//   - any still waiting on the client    → Waiting on client
//   - none waiting, some changes asked   → In progress (the work is back with the agency)
// Task linked to the deliverable: Approve moves it to Done; Request changes leaves it where it
// is (In review), and its card shows the red "Changes requested" badge.

import type { DecisionKind, DeliverableStatus, MilestoneStatus, TaskStatus } from "@/generated/prisma/enums";

/** Shown when the client asks for changes without saying what. */
export const CHANGES_COMMENT_REQUIRED = "Please add a comment so the team knows what to change.";

export function milestoneStatusAfter(current: DeliverableStatus[]): MilestoneStatus {
  if (current.length > 0 && current.every((s) => s === "APPROVED")) return "APPROVED";
  if (current.includes("WAITING")) return "WAITING";
  return "IN_PROGRESS";
}

/** The column the linked task moves to, or null to leave it where it is. */
export function taskMoveAfter(kind: DecisionKind): TaskStatus | null {
  return kind === "APPROVED" ? "DONE" : null;
}
