"use server";

import { head } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { recordActivity } from "@/features/activity/record";
import { checkClient, checkRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { milestoneStatusAfter, taskMoveAfter } from "./decisions";
import { ALLOWED_TYPES, isBlobUrl, uploadPrefix } from "./files";
import { decideDeliverableSchema, sendDeliverableSchema } from "./schemas";

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
  revalidatePath("/portal", "layout");
  return { ok: true };
}

const TASK_STEP = 1000;

/**
 * The client's Approve or Request changes on a deliverable waiting on them. Decisions are final.
 * Saves the decision, then applies the agreed rules (decisions.ts): the milestone is worked out
 * again from its current deliverables (Approved → approvedAt, a "completed milestone" line and the
 * next Up next milestone starts), and on Approve the linked task moves to the top of Done.
 */
export async function decideDeliverable(input: unknown): Promise<ActionResult> {
  const parsed = decideDeliverableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your decision." };
  const { projectId, deliverableId, kind } = parsed.data;
  const comment = parsed.data.comment || null;

  const access = await checkClient(projectId);
  if (!access.ok) return access;

  try {
    await db.$transaction(
      async (tx) => {
        // One read for everything the rules need: the milestone, its other current deliverables
        // and the tasks linked to this deliverable.
        const deliverable = await tx.deliverable.findFirst({
          where: { id: deliverableId, milestone: { projectId }, nextVersion: { is: null } },
          select: {
            id: true,
            title: true,
            tasks: { where: { projectId }, orderBy: { order: "asc" }, select: { id: true, status: true } },
            milestone: {
              select: {
                id: true,
                number: true,
                name: true,
                status: true,
                project: { select: { orgId: true } },
                deliverables: { where: { nextVersion: { is: null } }, select: { id: true, status: true } },
              },
            },
          },
        });
        if (!deliverable) throw new Refused("That deliverable isn't in this project.");

        // Only the first decision counts, even if two arrive at once.
        const claimed = await tx.deliverable.updateMany({
          where: { id: deliverable.id, status: "WAITING" },
          data: { status: kind },
        });
        if (claimed.count === 0) throw new Refused("This has already been decided.");

        await tx.decision.create({
          data: { deliverableId: deliverable.id, clientUserId: access.userId, kind, comment },
        });

        const now = new Date();
        const { milestone } = deliverable;
        const orgId = milestone.project.orgId;

        await recordActivity(tx, {
          orgId,
          projectId,
          actorId: access.userId,
          actorKind: "CLIENT",
          type: kind === "APPROVED" ? "DELIVERABLE_APPROVED" : "CHANGES_REQUESTED",
          subject: deliverable.title,
          detail: kind === "CHANGES_REQUESTED" ? comment : null,
          visibleToClient: true,
          createdAt: now,
        });

        // The linked task(s): Approve → top of Done. Request changes leaves them in place.
        const target = taskMoveAfter(kind);
        const moving = target ? deliverable.tasks.filter((t) => t.status !== target) : [];
        if (target && moving.length > 0) {
          const first = await tx.task.findFirst({
            where: { projectId, status: target },
            orderBy: { order: "asc" },
            select: { order: true },
          });
          let order = (first?.order ?? TASK_STEP * (moving.length + 1)) - TASK_STEP * moving.length;
          for (const t of moving) {
            await tx.task.update({
              where: { id: t.id },
              data: { status: target, order, ...(target === "DONE" && { completedAt: now }) },
            });
            order += TASK_STEP;
          }
        }

        // The milestone, from its current deliverables (this one now carries the decision).
        const statuses = milestone.deliverables.map((d) => (d.id === deliverable.id ? kind : d.status));
        const next = milestoneStatusAfter(statuses);
        if (next !== milestone.status) {
          await tx.milestone.update({
            where: { id: milestone.id },
            data: { status: next, approvedAt: next === "APPROVED" ? now : null },
          });
        }
        if (next === "APPROVED" && milestone.status !== "APPROVED") {
          await recordActivity(tx, {
            orgId,
            projectId,
            actorId: access.userId,
            actorKind: "CLIENT",
            type: "MILESTONE_COMPLETED",
            subject: milestone.name,
            detail: String(milestone.number),
            visibleToClient: true,
            createdAt: new Date(now.getTime() + 1),
          });
          // The next milestone starts, if it hasn't already.
          await tx.milestone.updateMany({
            where: { projectId, number: milestone.number + 1, status: "UP_NEXT" },
            data: { status: "IN_PROGRESS" },
          });
        }
      },
      // A decision writes up to nine rows; allow for a slow connection to the database.
      { timeout: 20_000 },
    );
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message };
    console.error("decideDeliverable failed", error);
    return { ok: false, error: "Your decision couldn't be saved. Please try again." };
  }

  revalidatePath("/portal", "layout");
  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}
