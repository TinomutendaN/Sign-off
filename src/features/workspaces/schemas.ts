import { z } from "zod";

/** Team settings "Workspace": the name Owners can change. */
export const renameWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Enter the workspace name.").max(60, "Keep the workspace name under 60 characters."),
});

export const TEAM_ROLES = ["member", "owner"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

/** "Invite a team member": an email and Team member or Owner. */
export const inviteTeamMemberSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  role: z.enum(TEAM_ROLES, "Pick a role."),
});
