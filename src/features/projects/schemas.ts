import { z } from "zod";

/** "Archive" on a project row. */
export const archiveProjectSchema = z.object({ projectId: z.string().min(1).max(40) });
