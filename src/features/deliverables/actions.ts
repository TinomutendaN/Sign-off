"use server";

import { head } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { recordActivity } from "@/features/activity/record";
import { checkRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ALLOWED_TYPES, isBlobUrl, uploadPrefix } from "./files";
import { sendDeliverableSchema } from "./schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

class Refused extends Error {}

/**
 * "Send to client for approval". The file is already in Blob (via /api/uploads); this saves the
 * deliverable as Waiting on client, puts its milestone in Waiting on client and records the
 * client-visible "sent … to {client}" line. With `replacesId` ("Upload new version") the new
 * deliverable replaces a Changes requested one: the old version and its decision stay as history,
 * and tasks linked to the old version move to the new one, so their board badge follows.
 */
export async function sendDeliverable(input: unknown): Promise<ActionResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = sendDeliverableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the deliverable details." };
  const { projectId, milestoneId, title, note, file, replacesId } = parsed.data;

  const milestone = await db.milestone.findFirst({
    where: { id: milestoneId, projectId, project: { orgId: access.orgId } },
    select: { id: true, status: true },
  });
  if (!milestone) return { ok: false, error: "That milestone isn't in this project." };
  if (milestone.status === "APPROVED") return { ok: false, error: "That milestone is already approved. Pick another." };

  // The file must be ours: in Blob, under this workspace and project. Its real size and type
  // come from Blob, not from the browser.
  const prefix = uploadPrefix(access.orgId, projectId);
  if (!isBlobUrl(file.url) || !file.pathname.startsWith(prefix)) {
    return { ok: false, error: "That file wasn't uploaded to this project." };
  }
  let blob: Awaited<ReturnType<typeof head>>;
  try {
    blob = await head(file.url);
  } catch {
    return { ok: false, error: "The uploaded file couldn't be found. Please upload it again." };
  }
  if (blob.pathname !== file.pathname || !ALLOWED_TYPES.includes(blob.contentType)) {
    return { ok: false, error: "That file wasn't uploaded to this project." };
  }

  try {
    await db.$transaction(async (tx) => {
      if (replacesId) {
        const old = await tx.deliverable.findFirst({
          where: { id: replacesId, milestone: { projectId }, nextVersion: { is: null } },
          select: { status: true },
        });
        if (!old) throw new Refused("That deliverable already has a newer version.");
        if (old.status !== "CHANGES_REQUESTED") throw new Refused("Only deliverables with changes requested get a new version.");
      }

      const created = await tx.deliverable.create({
        data: {
          milestoneId,
          title,
          note: note || null,
          fileUrl: blob.url,
          fileName: file.name,
          filePathname: blob.pathname,
          size: blob.size,
          status: "WAITING",
          sentById: access.userId,
          sentAt: new Date(),
          previousVersionId: replacesId ?? null,
        },
        select: { id: true },
      });

      if (replacesId) {
        await tx.task.updateMany({ where: { deliverableId: replacesId }, data: { deliverableId: created.id } });
      }
      if (milestone.status !== "WAITING") {
        await tx.milestone.update({ where: { id: milestoneId }, data: { status: "WAITING" } });
      }
      await recordActivity(tx, {
        orgId: access.orgId,
        projectId,
        actorId: access.userId,
        type: "DELIVERABLE_SENT",
        subject: title,
        visibleToClient: true,
      });
    });
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That deliverable already has a newer version." };
    }
    return { ok: false, error: "The deliverable couldn't be sent. Please try again." };
  }

  revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true };
}
