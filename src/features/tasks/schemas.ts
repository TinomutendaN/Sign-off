import { z } from "zod";
import { STATUSES } from "./labels";

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
