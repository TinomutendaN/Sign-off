"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, TaskStatus } from "@/generated/prisma/client";
import { recordActivity } from "@/features/activity/record";
import { checkRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABEL } from "./labels";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { fromDateInput } from "@/lib/format";
import {
  createTaskSchema,
  moveTaskSchema,
  postCommentSchema,
  setTaskStatusSchema,
  updateTaskSchema,
} from "./schemas";

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

type Access = { orgId: string; userId: string };
type MovingTask = { id: string; projectId: string; status: TaskStatus; title: string };

/**
 * Writes a task's new column and position. Entering Done sets completedAt and records
 * "finished …" (shown on the Dashboard and to the client); leaving Done clears completedAt;
 * other column changes record "moved … to …"; a reorder inside the same column records nothing.
 */
async function saveMove(tx: Prisma.TransactionClient, access: Access, task: MovingTask, status: TaskStatus, order: number) {
  const enteringDone = status === "DONE" && task.status !== "DONE";
  const leavingDone = status !== "DONE" && task.status === "DONE";
  await tx.task.update({
    where: { id: task.id },
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
}

/** Saves a dragged card's new column and position, between the cards it was dropped between. */
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

      await saveMove(tx, access, task, status, order);
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

/** A status pill in the task panel: the task moves to the end of that column (same rules as a drag). */
export async function setTaskStatus(input: unknown): Promise<ActionResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = setTaskStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That status couldn't be saved." };
  const { taskId, status } = parsed.data;

  let projectId: string | null;
  try {
    projectId = await db.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, project: { orgId: access.orgId } },
        select: { id: true, projectId: true, status: true, title: true },
      });
      if (!task) throw new BoardChanged();
      if (task.status === status) return null;

      const last = await tx.task.findFirst({
        where: { projectId: task.projectId, status, id: { not: taskId } },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      await saveMove(tx, access, task, status, (last?.order ?? 0) + STEP);
      return task.projectId;
    });
  } catch (error) {
    if (error instanceof BoardChanged) return { ok: false, error: "This task isn't in your workspace any more." };
    return { ok: false, error: "That status couldn't be saved. Please try again." };
  }

  if (projectId) revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true };
}

/** Changes the assignee, due date, milestone or type from the task panel's small menus. */
export async function updateTask(input: unknown): Promise<ActionResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "That change couldn't be saved." };
  const change = parsed.data;

  const task = await db.task.findFirst({
    where: { id: change.taskId, project: { orgId: access.orgId } },
    select: { id: true, projectId: true },
  });
  if (!task) return { ok: false, error: "This task isn't in your workspace any more." };

  let data: Prisma.TaskUncheckedUpdateInput;
  switch (change.field) {
    case "assignee": {
      if (change.value) {
        const members = await getMemberDirectory(access.orgId);
        if (!members.some((m) => m.id === change.value)) return { ok: false, error: "That person isn't on the team." };
      }
      data = { assigneeId: change.value };
      break;
    }
    case "dueDate":
      data = { dueDate: change.value ? fromDateInput(change.value) : null };
      break;
    case "milestone": {
      if (change.value) {
        const milestone = await db.milestone.findFirst({
          where: { id: change.value, projectId: task.projectId },
          select: { id: true },
        });
        if (!milestone) return { ok: false, error: "That milestone isn't in this project." };
      }
      data = { milestoneId: change.value };
      break;
    }
    case "type":
      data = { type: change.value };
      break;
  }

  try {
    await db.task.update({ where: { id: task.id }, data });
  } catch {
    return { ok: false, error: "That change couldn't be saved. Please try again." };
  }

  revalidatePath(`/projects/${task.projectId}`, "layout");
  return { ok: true };
}

/** Posts a team-only comment on a task (never shown to clients) and records "commented on …". */
export async function postComment(input: unknown): Promise<ActionResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = postCommentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your comment." };
  const { taskId, text } = parsed.data;

  const task = await db.task.findFirst({
    where: { id: taskId, project: { orgId: access.orgId } },
    select: { id: true, projectId: true, title: true },
  });
  if (!task) return { ok: false, error: "This task isn't in your workspace any more." };

  try {
    await db.$transaction(async (tx) => {
      await tx.comment.create({ data: { taskId, authorId: access.userId, text } });
      await recordActivity(tx, {
        orgId: access.orgId,
        projectId: task.projectId,
        actorId: access.userId,
        type: "TASK_COMMENTED",
        subject: task.title,
        visibleToClient: false,
      });
    });
  } catch {
    return { ok: false, error: "Your comment couldn't be posted. Please try again." };
  }

  revalidatePath(`/projects/${task.projectId}`, "layout");
  return { ok: true };
}
