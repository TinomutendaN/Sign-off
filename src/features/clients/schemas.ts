import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

/** "Invite a client": the client, their contact and the first project. */
export const clientInviteSchema = z.object({
  company: z.string().trim().min(2, "Enter the company name.").max(60, "Keep the company name under 60 characters."),
  contactName: z.string().trim().min(1, "Enter the contact's name.").max(80, "Keep the name under 80 characters."),
  contactEmail: email,
  projectName: z.string().trim().min(2, "Name the first project.").max(60, "Keep the project name under 60 characters."),
});
export type ClientInviteInput = z.infer<typeof clientInviteSchema>;

/** "Resend invite" on a client card. */
export const resendInviteSchema = z.object({ clientId: z.string().min(1).max(40) });
