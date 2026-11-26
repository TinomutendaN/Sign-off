"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/features/activity/record";
import { checkRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { REMINDER_COOLDOWN_MS } from "./queries";
import { sendReminderSchema } from "./schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

class Refused extends Error {}

/**
 * "Send reminder". There is no email behind it: it records a "sent {client} a reminder about …"
 * line that the client also sees in their portal. Once per deliverable every 24 hours; a new
 * version (sent later) can be reminded about straight away.
 */
export async function sendReminder(input: unknown): Promise<ActionResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = sendReminderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That reminder couldn't be sent." };

  let projectId: string;
  try {
    projectId = await db.$transaction(async (tx) => {
      const deliverable = await tx.deliverable.findFirst({
        where: {
          id: parsed.data.deliverableId,
          nextVersion: { is: null },
          milestone: { project: { orgId: access.orgId, status: "ACTIVE" } },
        },
        select: { title: true, status: true, sentAt: true, milestone: { select: { projectId: true } } },
      });
      if (!deliverable) throw new Refused("That deliverable isn't in this workspace.");
      if (deliverable.status !== "WAITING") throw new Refused("The client has already decided on this.");

      const { projectId } = deliverable.milestone;
      const since = new Date(Math.max(deliverable.sentAt.getTime(), Date.now() - REMINDER_COOLDOWN_MS));
      const recent = await tx.activity.findFirst({
        where: { orgId: access.orgId, projectId, type: "REMINDER_SENT", subject: deliverable.title, createdAt: { gte: since } },
        select: { id: true },
      });
      if (recent) throw new Refused("A reminder was already sent in the last 24 hours.");

      await recordActivity(tx, {
        orgId: access.orgId,
        projectId,
        actorId: access.userId,
        type: "REMINDER_SENT",
        subject: deliverable.title,
        visibleToClient: true,
      });
      return projectId;
    });
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message };
    return { ok: false, error: "The reminder couldn't be sent. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath("/portal", "layout");
  return { ok: true };
}
