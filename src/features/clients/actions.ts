"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/features/activity/record";
import { projectLimitReached } from "@/features/billing/queries";
import { isDemoOrg, requestOrigin } from "@/features/workspaces/demo";
import { checkRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientInviteSchema, resendInviteSchema } from "./schemas";

/** What the "Invite sent" state shows. The same whether or not the email already has an account. */
export type InviteSent = {
  ok: true;
  url: string;
  /** False in the demo workspace: no email goes out, the agency shares the link. */
  emailSent: boolean;
  contactName: string;
  projectName: string;
};
/** `limit: "projects"`: the plan allows no more active projects, so the UI opens the upgrade pop-up. */
export type InviteResult = InviteSent | { ok: false; error: string; limit?: "projects" };

/** New projects take the first colour no active project in the workspace uses. */
const PROJECT_COLOURS = ["violet", "amber", "green", "blue", "red"] as const;

/**
 * Creates a Clerk invitation to the client portal. The sign-up page reads `?client=` to show the
 * company and project; who gets access is decided by the ClientInvite row, never by the link.
 */
async function createClerkInvitation(email: string, clientId: string, orgId: string) {
  const clerk = await clerkClient();
  return clerk.invitations.createInvitation({
    emailAddress: email,
    redirectUrl: `${await requestOrigin()}/sign-up?client=${clientId}`,
    notify: !isDemoOrg(orgId),
    // Also invite people who already have an account; they accept with "Accept and sign in".
    ignoreExisting: true,
  });
}

function revalidateClientScreens() {
  revalidatePath("/clients");
  revalidatePath("/settings");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

/**
 * "Create project and send invite" (Owners and Team members). Refused with `limit: "projects"`
 * when the plan's project limit is reached (Free: 2 active). Otherwise creates the client, their first
 * project with a "1. Getting started" milestone, a Clerk invitation and the ClientInvite row the
 * invited person claims when they first sign in (claimClientInvites).
 */
export async function createClientInvite(input: unknown): Promise<InviteResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = clientInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the invite details." };
  const { company, contactName, contactEmail, projectName } = parsed.data;
  const { orgId, userId } = access;

  // Checked on the server, so the limit holds even if the pop-up is skipped.
  if (await projectLimitReached(orgId)) {
    return { ok: false, limit: "projects", error: "You've used both Free projects. Upgrade to start a third project." };
  }

  const used = await db.project.findMany({ where: { orgId, status: "ACTIVE" }, select: { colour: true } });
  const colour = PROJECT_COLOURS.find((c) => !used.some((p) => p.colour === c)) ?? PROJECT_COLOURS[used.length % 5];
  const now = new Date();

  let created: { clientId: string; projectId: string };
  try {
    created = await db.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: { orgId, name: company, contactName, contactEmail, invitedAt: now },
        select: { id: true },
      });
      const project = await tx.project.create({
        data: { orgId, clientId: client.id, name: projectName, colour },
        select: { id: true },
      });
      await tx.milestone.create({
        data: { projectId: project.id, number: 1, name: "Getting started", status: "IN_PROGRESS" },
      });
      await recordActivity(tx, {
        orgId,
        projectId: project.id,
        actorId: userId,
        type: "PROJECT_CREATED",
        subject: projectName,
        visibleToClient: true,
      });
      return { clientId: client.id, projectId: project.id };
    }, { timeout: 20_000 });
  } catch (error) {
    console.error("createClientInvite failed", error);
    return { ok: false, error: "The client couldn't be created. Please try again." };
  }

  try {
    const invitation = await createClerkInvitation(contactEmail, created.clientId, orgId);
    await db.clientInvite.create({
      data: {
        email: contactEmail,
        clientId: created.clientId,
        projectId: created.projectId,
        orgId,
        invitationId: invitation.id,
      },
    });
    revalidateClientScreens();
    return { ok: true, url: invitation.url ?? "", emailSent: !isDemoOrg(orgId), contactName, projectName };
  } catch (error) {
    console.error("createClientInvite: invitation failed", error);
    // No invitation, so no half-made client: the cascade removes the project and milestone too.
    await db.client.delete({ where: { id: created.clientId } }).catch(() => {});
    return { ok: false, error: "The invitation couldn't be created. Please check the email and try again." };
  }
}

/**
 * "Resend invite": replaces the client's open invitation with a new one (Clerk invitations
 * can't be re-sent), so the old link stops working and the new one goes out or is shown.
 */
export async function resendClientInvite(input: unknown): Promise<InviteResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;

  const parsed = resendInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a client." };

  const invite = await db.clientInvite.findFirst({
    where: { clientId: parsed.data.clientId, orgId: access.orgId, claimedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      invitationId: true,
      project: { select: { name: true } },
      client: { select: { contactName: true } },
    },
  });
  if (!invite) return { ok: false, error: "This client has already joined." };

  const clerk = await clerkClient();
  // It may already be accepted or revoked; either way a fresh one replaces it.
  await clerk.invitations.revokeInvitation(invite.invitationId).catch(() => {});

  try {
    const invitation = await createClerkInvitation(invite.email, parsed.data.clientId, access.orgId);
    await db.$transaction([
      db.clientInvite.update({ where: { id: invite.id }, data: { invitationId: invitation.id } }),
      db.client.update({ where: { id: parsed.data.clientId }, data: { invitedAt: new Date() } }),
    ]);
    revalidateClientScreens();
    return {
      ok: true,
      url: invitation.url ?? "",
      emailSent: !isDemoOrg(access.orgId),
      contactName: invite.client.contactName,
      projectName: invite.project.name,
    };
  } catch (error) {
    console.error("resendClientInvite failed", error);
    return { ok: false, error: "The invitation couldn't be sent again. Please try again." };
  }
}

/**
 * Gives the signed-in person the projects they were invited to as a client: every unclaimed
 * ClientInvite for one of their verified email addresses becomes ClientAccess. Runs when they
 * land after signing in (lib/auth.ts), so it covers new sign-ups and existing accounts alike.
 * Only ever acts for the person signed in. Returns how many invites were claimed.
 */
export async function claimClientInvites(): Promise<number> {
  const { userId } = await auth({ treatPendingAsSignedOut: false });
  if (!userId) return 0;

  const user = await currentUser();
  const emails = (user?.emailAddresses ?? [])
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress.toLowerCase());
  if (emails.length === 0) return 0;

  const invites = await db.clientInvite.findMany({
    where: { email: { in: emails }, claimedAt: null },
    select: { id: true, clientId: true, projectId: true },
  });
  if (invites.length === 0) return 0;

  // No transaction needed: access first (repeating it is harmless, skipDuplicates), then mark
  // the invites claimed. If the second write fails, the next landing simply does both again.
  await db.clientAccess.createMany({
    data: invites.map((i) => ({ userId, clientId: i.clientId, projectId: i.projectId })),
    skipDuplicates: true,
  });
  const claimed = await db.clientInvite.updateMany({
    where: { id: { in: invites.map((i) => i.id) }, claimedAt: null },
    data: { claimedAt: new Date(), claimedByUserId: userId },
  });
  return claimed.count;
}
