import type { ActivityType } from "@/generated/prisma/enums";
import type { AvatarTone } from "@/components/ui/Avatar";
import type { Member } from "@/features/workspaces/queries";
import { db } from "@/lib/db";
import { dateTime, displayName, initials, nameInitials } from "@/lib/format";

/** One activity row, worded for the agency. */
export type ActivityLine = {
  id: string;
  who: string;
  text: string;
  when: string;
  avatar: { label: string; tone: AvatarTone };
};

type Event = { type: ActivityType; subject: string; detail: string | null };

/** What the agency reads after the person's name: "finished Domain and hosting setup". */
export function agencyWording({ type, subject, detail }: Event, clientName: string): string {
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
      return `sent ${subject} to ${clientName}`;
    case "DELIVERABLE_APPROVED":
      return `approved ${subject}`;
    case "CHANGES_REQUESTED":
      return `asked for changes on ${subject}`;
    case "DELIVERABLE_REPLY":
      return detail ? `replied on ${subject}: ${detail}` : `replied on ${subject}`;
    case "MILESTONE_COMPLETED":
      return detail ? `completed milestone ${detail}, ${subject}` : `completed milestone ${subject}`;
    case "REMINDER_SENT":
      return `sent ${clientName} a reminder about ${subject}`;
    case "PROJECT_CREATED":
      return `started ${subject}`;
  }
}

/** A project's activity rows, newest first, including team-only lines. */
export async function getProjectActivity(projectId: string) {
  return db.activity.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, actorId: true, actorKind: true, type: true, subject: true, detail: true, createdAt: true },
  });
}

/** Activity rows → lines worded for the agency, with names and avatars. */
export function toActivityLines(
  rows: Awaited<ReturnType<typeof getProjectActivity>>,
  clientName: string,
  members: Member[],
): ActivityLine[] {
  const now = new Date();
  return rows.map((row) => {
    const member = members.find((m) => m.id === row.actorId);
    const isClient = row.actorKind === "CLIENT";
    const who = isClient ? clientName : member ? displayName(member) : "A former team member";
    const avatar = isClient
      ? { label: nameInitials(clientName), tone: "peach" as const }
      : { label: member ? initials(member) : "?", tone: member?.tone ?? ("violet" as const) };
    return { id: row.id, who, text: agencyWording(row, clientName), when: dateTime(row.createdAt, now), avatar };
  });
}
