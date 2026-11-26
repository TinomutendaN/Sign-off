import { z } from "zod";
import { CHANGES_COMMENT_REQUIRED } from "./decisions";

const id = z.string().min(1).max(40);

/** What the upload panel sends to the upload route, alongside the file (its size in bytes). */
export const uploadPayloadSchema = z.object({ projectId: id, size: z.number().int().nonnegative() });

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

/** The client's Approve or Request changes. A comment is needed when asking for changes. */
export const decideDeliverableSchema = z
  .object({
    projectId: id,
    deliverableId: id,
    kind: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
    comment: z.string().trim().max(2000, "Keep the comment under 2,000 characters.").optional(),
  })
  .refine((d) => d.kind === "APPROVED" || (d.comment ?? "").length > 0, {
    message: CHANGES_COMMENT_REQUIRED,
    path: ["comment"],
  });
export type DecideDeliverableInput = z.infer<typeof decideDeliverableSchema>;
