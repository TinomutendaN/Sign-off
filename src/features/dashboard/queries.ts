import { db } from "@/lib/db";
import { next7Days } from "@/lib/format";

/** A deliverable can be reminded about once every 24 hours. */
export const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Everything the Dashboard (04) shows for one workspace, from four reads:
 * active projects, current deliverables waiting on or sent back by clients, tasks due in the next
 * seven days (today included), and the newest five activity lines.
 */
export async function getDashboard(orgId: string, now: Date = new Date()) {
  const week = next7Days(now);
  const reminderSince = new Date(now.getTime() - REMINDER_COOLDOWN_MS);

  const [projects, deliverables, due, activity, reminders] = await Promise.all([
    db.project.findMany({
      where: { orgId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        colour: true,
        dueDate: true,
        status: true,
        client: { select: { name: true } },
        milestones: {
          orderBy: { number: "asc" },
          select: { number: true, name: true, status: true, tasks: { select: { status: true } } },
        },
        tasks: { select: { status: true } },
      },
    }),
    db.deliverable.findMany({
      where: {
        status: { in: ["WAITING", "CHANGES_REQUESTED"] },
        nextVersion: { is: null },
        milestone: { project: { orgId, status: "ACTIVE" } },
      },
      orderBy: { sentAt: "asc" },
      select: {
        id: true,
        title: true,
        status: true,
        sentAt: true,
        milestone: { select: { project: { select: { id: true, name: true, client: { select: { name: true } } } } } },
        decisions: { orderBy: { createdAt: "desc" }, take: 1, select: { comment: true } },
      },
    }),
    db.task.findMany({
      where: {
        project: { orgId, status: "ACTIVE" },
        status: { not: "DONE" },
        dueDate: { gte: week.start, lte: week.end },
      },
      orderBy: [{ dueDate: "asc" }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        assigneeId: true,
        dueDate: true,
        deliverable: { select: { status: true } },
      },
    }),
    db.activity.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        actorId: true,
        actorKind: true,
        type: true,
        subject: true,
        detail: true,
        createdAt: true,
        project: { select: { client: { select: { name: true } } } },
      },
    }),
    db.activity.findMany({
      where: { orgId, type: "REMINDER_SENT", createdAt: { gte: reminderSince } },
      select: { projectId: true, subject: true, createdAt: true },
    }),
  ]);

  const waiting = deliverables.map((d) => {
    const project = d.milestone.project;
    const reminded = reminders.some(
      (r) => r.projectId === project.id && r.subject === d.title && r.createdAt >= d.sentAt,
    );
    return {
      id: d.id,
      title: d.title,
      status: d.status,
      sentAt: d.sentAt,
      projectId: project.id,
      clientName: project.client.name,
      comment: d.decisions[0]?.comment ?? null,
      reminded,
    };
  });

  return { projects, waiting, due, activity };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
