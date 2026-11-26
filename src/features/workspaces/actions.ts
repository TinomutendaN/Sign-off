"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { revalidatePath, updateTag } from "next/cache";
import { getPlanLimits } from "@/features/billing/queries";
import { checkRole } from "@/lib/auth";
import { isDemoOrg, requestOrigin } from "./demo";
import { inviteeName, workspaceTag } from "./queries";
import { inviteTeamMemberSchema, renameWorkspaceSchema } from "./schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type TeamInviteResult =
  | {
      ok: true;
      name: string;
      role: "member" | "owner";
      /** The invite link, shown only in the demo workspace (where no email is sent). */
      url: string | null;
      emailSent: boolean;
    }
  | { ok: false; error: string };

/** Team settings "Save": renames the workspace in Clerk (Owners only). */
export async function renameWorkspace(input: unknown): Promise<ActionResult> {
  const access = await checkRole("OWNER");
  if (!access.ok) return access;

  const parsed = renameWorkspaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the name." };

  try {
    const clerk = await clerkClient();
    await clerk.organizations.updateOrganization(access.orgId, { name: parsed.data.name });
  } catch {
    return { ok: false, error: "The name couldn't be saved. Please try again." };
  }
  updateTag(workspaceTag(access.orgId));
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Clerk's refusal in plain words. */
function inviteError(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const code = error.errors[0]?.code ?? "";
    if (code.includes("quota") || code.includes("limit")) {
      return "Your workspace is full. Remove someone or upgrade to add more team members.";
    }
    if (code === "already_a_member_in_organization") return "That person is already on your team.";
    if (code === "duplicate_record") return "That person already has an invite waiting.";
    return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? "The invite couldn't be sent.";
  }
  return "The invite couldn't be sent. Please try again.";
}

/**
 * "Send invite" (Owners only): a Clerk organization invitation as Team member (org:member) or
 * Owner (org:admin). In the demo workspace no email is sent; the link is shown instead.
 */
export async function inviteTeamMember(input: unknown): Promise<TeamInviteResult> {
  const access = await checkRole("OWNER");
  if (!access.ok) return access;

  const parsed = inviteTeamMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the invite." };
  const { email, role } = parsed.data;
  const demo = isDemoOrg(access.orgId);

  try {
    const clerk = await clerkClient();

    // The plan's team size (Free 5, Pro 15, Agency 20) counts members and waiting invites.
    // Clerk enforces the same number (maxAllowedMemberships); this check gives a clear message.
    const [{ plan, limits }, memberships, pending] = await Promise.all([
      getPlanLimits(),
      clerk.organizations.getOrganizationMembershipList({ organizationId: access.orgId, limit: 1 }),
      clerk.organizations.getOrganizationInvitationList({ organizationId: access.orgId, status: ["pending"], limit: 1 }),
    ]);
    if (memberships.totalCount + pending.totalCount >= limits.members) {
      return {
        ok: false,
        error:
          plan === "agency"
            ? `Your workspace has all ${limits.members} team members its plan allows.`
            : `Your workspace has all ${limits.members} team members its plan allows. Upgrade to add more.`,
      };
    }

    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: access.orgId,
      inviterUserId: access.userId,
      emailAddress: email,
      role: role === "owner" ? "org:admin" : "org:member",
      redirectUrl: `${await requestOrigin()}/sign-up?invite=team&org=${access.orgId}`,
      // Clerk's API takes `notify`; the SDK type leaves it out but passes it through.
      ...({ notify: !demo } as object),
    });
    revalidatePath("/settings");
    return { ok: true, name: inviteeName(email), role, url: demo ? invitation.url : null, emailSent: !demo };
  } catch (error) {
    console.error("inviteTeamMember failed", error);
    return { ok: false, error: inviteError(error) };
  }
}
