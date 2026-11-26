import { z } from "zod";

/** "Send reminder" on a deliverable waiting on the client. */
export const sendReminderSchema = z.object({ deliverableId: z.string().min(1).max(40) });
