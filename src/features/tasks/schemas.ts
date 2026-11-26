import { z } from "zod";
import { STATUSES, TYPES } from "./labels";

const id = z.string().min(1).max(40);

/** A card dropped into `status`, between the cards `prevId` (above) and `nextId` (below). */
export const moveTaskSchema = z.object({
  taskId: id,
  status: z.enum(STATUSES),
  prevId: id.nullable(),
  nextId: id.nullable(),
});
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

export const createTaskSchema = z.object({
  projectId: id,
  status: z.enum(STATUSES),
  title: z.string().trim().min(1, "Give the task a title.").max(200, "Keep the title under 200 characters."),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/** A status pill in the task panel: the task moves to the end of that column. */
export const setTaskStatusSchema = z.object({ taskId: id, status: z.enum(STATUSES) });
export type SetTaskStatusInput = z.infer<typeof setTaskStatusSchema>;

/** One detail value changed from the task panel's small menus. */
export const updateTaskSchema = z.discriminatedUnion("field", [
  z.object({ taskId: id, field: z.literal("assignee"), value: id.nullable() }),
  z.object({
    taskId: id,
    field: z.literal("dueDate"),
    value: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.").nullable(),
  }),
  z.object({ taskId: id, field: z.literal("milestone"), value: id.nullable() }),
  z.object({ taskId: id, field: z.literal("type"), value: z.enum(TYPES) }),
]);
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const postCommentSchema = z.object({
  taskId: id,
  text: z.string().trim().min(1, "Write a comment first.").max(2000, "Keep comments under 2,000 characters."),
});
export type PostCommentInput = z.infer<typeof postCommentSchema>;
