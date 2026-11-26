// Who may see what. Every layout, page and Server Action checks access through this file.
//
// Roles: Owner (Clerk org:admin), Team member (org:member), Client (a ClientAccess row),
// SIGNoFF admin (user ID listed in ADMIN_USER_IDS).
//
// The require* helpers redirect people to their own area. The check* helpers are for
// Server Actions: they never redirect, they return { ok: false, error } instead.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { claimClientInvites } from "@/features/clients/actions";
import { hasClientAccess } from "@/features/clients/queries";
import { getUserOrgIds } from "@/features/workspaces/queries";

export type Role = "OWNER" | "MEMBER";

/** Where a signed-in person belongs, and the workspace to make active on the way there. */
export type Landing = { path: string; orgId?: string };

type Denied = { ok: false; error: string; redirectTo: string };
type Allowed<T> = { ok: true } & T;
type Result<T> = Allowed<T> | Denied;

/** The page that opens a person's workspace before sending them to /dashboard. */
const CONTINUE_PATH = "/sign-in/continue";

function session() {
  // A brand-new session can carry a pending task; still count it as signed in here.
  return auth({ treatPendingAsSignedOut: false });
}

export function isAdminUser(userId: string) {
  const ids = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.includes(userId);
}

async function landingFor(userId: string, activeOrgId: string | null | undefined): Promise<Landing> {
  if (isAdminUser(userId)) return { path: "/admin" };

  // Client invites are claimed here, the first time an invited person lands after signing in
  // (their verified email matches an unclaimed invite). New sign-ups and existing accounts alike.
  await claimClientInvites();

  const orgIds = await getUserOrgIds(userId);
  if (orgIds.length > 0) {
    const orgId = activeOrgId && orgIds.includes(activeOrgId) ? activeOrgId : orgIds[0];
    return { path: "/dashboard", orgId };
  }

  if (await hasClientAccess(userId)) return { path: "/portal" };

  // Signed in, but no workspace and no client access: the "Create your workspace" state.
  return { path: "/sign-up" };
}

/**
 * The one place that decides where a person lands after signing in:
 * admin → /admin, workspace member → /dashboard (with that workspace active),
 * client → /portal, anyone else → /sign-up to create their workspace.
 */
export async function getLanding(): Promise<Landing> {
  const { userId, orgId } = await session();
  if (!userId) return { path: "/sign-in" };
  return landingFor(userId, orgId);
}

/** The URL to send someone to: their landing page, or the step that activates their workspace first. */
export function landingUrl(landing: Landing, activeOrgId: string | null | undefined) {
  return landing.orgId && landing.orgId !== activeOrgId ? CONTINUE_PATH : landing.path;
}

async function sendHome(userId: string, activeOrgId: string | null | undefined, error: string): Promise<Denied> {
  const landing = await landingFor(userId, activeOrgId);
  return { ok: false, error, redirectTo: landingUrl(landing, activeOrgId) };
}

const signedOut: Denied = { ok: false, error: "Please sign in.", redirectTo: "/sign-in" };

async function evaluateRole(role: Role): Promise<Result<{ userId: string; orgId: string; isOwner: boolean }>> {
  const { userId, orgId, has } = await session();
  if (!userId) return signedOut;
  if (!orgId) return sendHome(userId, orgId, "Open a workspace first.");

  const isOwner = has({ role: "org:admin" });
  const isMember = isOwner || has({ role: "org:member" });
  if (!isMember) return sendHome(userId, orgId, "You're not a member of this workspace.");
  if (role === "OWNER" && !isOwner) {
    return { ok: false, error: "Only the workspace owner can do this.", redirectTo: "/dashboard" };
  }
  return { ok: true, userId, orgId, isOwner };
}

async function evaluateClient(projectId?: string): Promise<Result<{ userId: string }>> {
  const { userId, orgId } = await session();
  if (!userId) return signedOut;
  if (await hasClientAccess(userId, projectId)) return { ok: true, userId };
  if (projectId && (await hasClientAccess(userId))) {
    return { ok: false, error: "This project isn't shared with you.", redirectTo: "/portal" };
  }
  return sendHome(userId, orgId, "This area is for clients.");
}

async function evaluateAdmin(): Promise<Result<{ userId: string }>> {
  const { userId, orgId } = await session();
  if (!userId) return signedOut;
  if (isAdminUser(userId)) return { ok: true, userId };
  return sendHome(userId, orgId, "This area is for the SIGNoFF admin.");
}

function strip<T>(result: Result<T>): Allowed<T> | { ok: false; error: string } {
  return result.ok ? result : { ok: false, error: result.error };
}

// Pages and layouts: redirect anyone who doesn't belong.

/** Signed in, in an active workspace, with the right role ("MEMBER" also lets Owners in). */
export async function requireRole(role: Role) {
  const result = await evaluateRole(role);
  if (!result.ok) redirect(result.redirectTo);
  return result;
}

/** Signed in and has client access (to this project, if one is given). */
export async function requireClient(projectId?: string) {
  const result = await evaluateClient(projectId);
  if (!result.ok) redirect(result.redirectTo);
  return result;
}

/** Signed in as a SIGNoFF admin. */
export async function requireAdmin() {
  const result = await evaluateAdmin();
  if (!result.ok) redirect(result.redirectTo);
  return result;
}

// Server Actions: return an error instead of redirecting.

export async function checkRole(role: Role) {
  return strip(await evaluateRole(role));
}

export async function checkClient(projectId?: string) {
  return strip(await evaluateClient(projectId));
}

export async function checkAdmin() {
  return strip(await evaluateAdmin());
}
