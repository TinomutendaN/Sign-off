// How the portal words things for the client: "You approved …", "Waiting on you".

import type { ActivityType, MilestoneStatus } from "@/generated/prisma/enums";
import type { PillTone } from "@/components/ui/Pill";
import type { BarTone } from "@/components/ui/ProgressBar";
import type { ActivityLine } from "@/features/activity/queries";
import type { Member } from "@/features/workspaces/queries";
import { dateTime, displayName, initials, nameInitials, shortDate } from "@/lib/format";
import type { PortalActivityRow, PortalDeliverable } from "./queries";

type Event = { type: ActivityType; subject: string; detail: string | null };

/** What the client reads after the person's name: "sent Homepage design, version 2 for your approval". */
export function clientWording({ type, subject, detail }: Event): string {
  switch (type) {
    case "TASK_CREATED":
      return `added ${subject}`;
    case "TASK_MOVED":
      return detail ? `moved ${subject} to ${detail}` : `moved ${subject}`;
    case "TASK_COMMENTED":
      return `commented on ${subject}`;
    case "TASK_DONE":
      return `finished ${subject}`;
    case "DELIVERABLE_SENT":
      return `sent ${subject} for your approval`;
    case "DELIVERABLE_APPROVED":
      return `approved ${subject}`;
    case "CHANGES_REQUESTED":
      return `asked for changes on ${subject}`;
    case "DELIVERABLE_REPLY":
      return detail ? `replied on ${subject}: ${detail}` : `replied on ${subject}`;
    case "MILESTONE_COMPLETED":
      return detail ? `completed milestone ${detail}, ${subject}` : `completed milestone ${subject}`;
    case "REMINDER_SENT":
      return `sent you a reminder about ${subject}`;
    case "PROJECT_CREATED":
      return `started ${subject}`;
  }
}

/**
 * Client-visible activity rows → lines for the client. Their own actions read "You" (with their
 * company's peach avatar); the agency's team appear by name ("Leo R.").
 */
export function toClientActivityLines(
  rows: PortalActivityRow[],
  viewerId: string,
  clientName: string,
  agency: { name: string; members: Member[] },
): ActivityLine[] {
  const now = new Date();
  return rows.map((row) => {
    const when = dateTime(row.createdAt, now);
    const text = clientWording(row);
    if (row.actorKind === "CLIENT") {
      const who = row.actorId === viewerId ? "You" : clientName;
      return { id: row.id, who, text, when, avatar: { label: nameInitials(clientName), tone: "peach" as const } };
    }
    const member = agency.members.find((m) => m.id === row.actorId);
    const who = member ? displayName(member) : agency.name;
    const avatar = member
      ? { label: initials(member), tone: member.tone }
      : { label: nameInitials(agency.name), tone: "violet" as const };
    return { id: row.id, who, text, when, avatar };
  });
}

/** Milestone statuses in the client's words, with pill, bar, dot and text colours. */
export const CLIENT_MILESTONE_LOOK: Record<
  MilestoneStatus,
  { label: string; pill: PillTone; bar: BarTone; dot: string; text: string }
> = {
  APPROVED: { label: "Approved", pill: "green", bar: "green", dot: "bg-green", text: "text-green-ink" },
  WAITING: { label: "Waiting on you", pill: "amber", bar: "amber", dot: "bg-amber", text: "text-amber-ink" },
  IN_PROGRESS: { label: "In progress", pill: "progress", bar: "blue", dot: "bg-blue", text: "text-blue-ink" },
  UP_NEXT: { label: "Up next", pill: "white", bar: "idle", dot: "bg-idle", text: "text-ink-3" },
};

/** "Sent 22 Nov by Leo R." */
export function sentLine(d: PortalDeliverable, members: Member[]): string {
  const sender = members.find((m) => m.id === d.sentById);
  return `Sent ${shortDate(d.sentAt)}${sender ? ` by ${displayName(sender)}` : ""}`;
}

/**
 * The line under an earlier deliverable:
 * 'You asked for changes on 21 Nov: "Can we try …"' or "palette.pdf · Approved by you on 18 Nov".
 */
export function decidedLine(d: PortalDeliverable): string {
  const decision = d.decisions[0];
  if (!decision) return d.fileName;
  if (decision.kind === "CHANGES_REQUESTED") {
    const on = `You asked for changes on ${shortDate(decision.createdAt)}`;
    return decision.comment ? `${on}: "${decision.comment}"` : on;
  }
  return `${d.fileName} · Approved by you on ${shortDate(decision.createdAt)}`;
}
