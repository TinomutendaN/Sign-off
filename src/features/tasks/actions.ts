"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, TaskStatus } from "@/generated/prisma/client";
import { recordActivity } from "@/features/activity/record";
import { checkRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABEL } from "./labels";
import { createTaskSchema, moveTaskSchema } from "./schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STEP = 1000;
/** Below this gap between two neighbours, the column is renumbered before placing a card. */
const MIN_GAP = 0.0001;

class BoardChanged extends Error {}

/** Renumbers a column 1000, 2000, 3000… (leaving out the card being moved). */
async function renumberColumn(tx: Prisma.TransactionClient, projectId: string, status: TaskStatus, skipId: string) {
  const column = await tx.task.findMany({
    where: { projectId, status, id: { not: skipId } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  for (const [i, t] of column.entries()) {
    await tx.task.update({ where: { id: t.id }, data: { order: (i + 1) * STEP } });
  }
}

/**
 * Saves a card's new column and position. Entering Done records "finished …" (shown on the
 * Dashboard and to the client); other column changes record "moved … to …"; a reorder
 * inside the same column records nothing.
 */
export async function moveTask(input: unknown): Promise<ActionResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That move couldn't be saved." };
  const { taskId, status, prevId, nextId } = parsed.data;

  let projectId: string;
  try {
    projectId = await db.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, project: { orgId: access.orgId } },
        select: { id: true, projectId: true, status: true, title: true },
      });
      if (!task) throw new BoardChanged();

      const neighbours = async () => {
        const ids = [prevId, nextId].filter((x): x is string => Boolean(x));
        const rows = await tx.task.findMany({
          where: { id: { in: ids }, projectId: task.projectId, status, NOT: { id: taskId } },
          select: { id: true, order: true },
        });
        const prev = prevId ? rows.find((r) => r.id === prevId) : null;
        const next = nextId ? rows.find((r) => r.id === nextId) : null;
        if (prev === undefined || next === undefined) throw new BoardChanged();
        return { prev, next };
      };

      let { prev, next } = await neighbours();
      if (prev && next && (next.order - prev.order < MIN_GAP)) {
        await renumberColumn(tx, task.projectId, status, taskId);
        ({ prev, next } = await neighbours());
      }

      let order: number;
      if (prev && next) order = (prev.order + next.order) / 2;
      else if (prev) order = prev.order + STEP;
      else if (next) order = next.order - STEP;
      else order = STEP;

      const enteringDone = status === "DONE" && task.status !== "DONE";
      const leavingDone = status !== "DONE" && task.status === "DONE";
      await tx.task.update({
        where: { id: taskId },
        data: {
          status,
          order,
          ...(enteringDone && { completedAt: new Date() }),
          ...(leavingDone && { completedAt: null }),
        },
      });

      if (status !== task.status) {
        await recordActivity(tx, {
          orgId: access.orgId,
          projectId: task.projectId,
          actorId: access.userId,
          type: enteringDone ? "TASK_DONE" : "TASK_MOVED",
          subject: task.title,
          detail: enteringDone ? null : STATUS_LABEL[status],
          visibleToClient: enteringDone,
        });
      }
      return task.projectId;
    });
  } catch (error) {
    if (error instanceof BoardChanged) {
      return { ok: false, error: "The board changed while you were moving this card. Refresh and try again." };
    }
    return { ok: false, error: "That move couldn't be saved. Please try again." };
  }

  revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true };
}

/**
 * Adds a task with just a title, at the bottom of a column. It joins the project's current
 * milestone, is assigned to whoever added it, and starts as type Build (editable from the task panel).
 */
export async function createTask(input: unknown): Promise<ActionResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the task title." };
  const { projectId, status, title } = parsed.data;

  const project = await db.project.findFirst({
    where: { id: projectId, orgId: access.orgId },
    select: { id: true, milestones: { orderBy: { number: "asc" }, select: { id: true, status: true } } },
  });
  if (!project) return { ok: false, error: "This project isn't in your workspace." };

  const milestone = project.milestones.find((m) => m.status !== "APPROVED") ?? project.milestones.at(-1) ?? null;

  try {
    await db.$transaction(async (tx) => {
      const last = await tx.task.findFirst({
        where: { projectId, status },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      await tx.task.create({
        data: {
          projectId,
          milestoneId: milestone?.id ?? null,
          title,
          type: "BUILD",
          status,
          order: (last?.order ?? 0) + STEP,
          assigneeId: access.userId,
          completedAt: status === "DONE" ? new Date() : null,
        },
      });
      await recordActivity(tx, {
        orgId: access.orgId,
        projectId,
        actorId: access.userId,
        type: "TASK_CREATED",
        subject: title,
      });
    });
  } catch {
    return { ok: false, error: "The task couldn't be added. Please try again." };
  }

  revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true };
}
