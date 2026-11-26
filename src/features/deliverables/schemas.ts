import { z } from "zod";

const id = z.string().min(1).max(40);

/** What the upload panel sends to the upload route, alongside the file. */
export const uploadPayloadSchema = z.object({ projectId: id });

/** "Send to client for approval": a file already uploaded to Blob, plus its details. */
export const sendDeliverableSchema = z.object({
  projectId: id,
  milestoneId: id,
  title: z.string().trim().min(1, "Give the deliverable a title.").max(200, "Keep the title under 200 characters."),
  note: z.string().trim().max(2000, "Keep the note under 2,000 characters.").optional(),
  file: z.object({
    url: z.url().max(2000),
    pathname: z.string().min(1).max(1000),
    name: z.string().trim().min(1).max(255),
  }),
  /** Set by "Upload new version": the Changes requested deliverable this one replaces. */
  replacesId: id.optional(),
});
export type SendDeliverableInput = z.infer<typeof sendDeliverableSchema>;
