"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getLanding, type Landing } from "@/lib/auth";
import { demoRoleSchema, type DemoRole } from "./schemas";

type DemoTarget = { env: string; path: string; inWorkspace: boolean };

// The only people the demo cards can sign in as. User IDs come from the server's environment.
const DEMO_TARGETS: Record<DemoRole, DemoTarget> = {
  owner: { env: "DEMO_OWNER_USER_ID", path: "/dashboard", inWorkspace: true },
  member: { env: "DEMO_AMA_USER_ID", path: "/dashboard", inWorkspace: true },
  client: { env: "DEMO_CLIENT_USER_ID", path: "/portal", inWorkspace: false },
  admin: { env: "DEMO_ADMIN_USER_ID", path: "/admin", inWorkspace: false },
};

export type DemoStart = { ok: true; ticket: string; path: string; orgId?: string } | { ok: false; error: string };

/**
 * Creates a one-minute Clerk sign-in token for one of the four demo people. The page then
 * signs in with that ticket and opens the right area (Northfold Studio active for the team).
 */
export async function startDemo(role: unknown): Promise<DemoStart> {
  const parsed = demoRoleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Pick one of the demo roles." };

  const { userId: current } = await auth({ treatPendingAsSignedOut: false });
  if (current) return { ok: false, error: "You're already signed in. Sign out first to try another role." };

  const target = DEMO_TARGETS[parsed.data];
  const userId = process.env[target.env]?.trim();
  const orgId = process.env.DEMO_ORG_ID?.trim();
  if (!userId || (target.inWorkspace && !orgId)) {
    return { ok: false, error: "The demo isn't set up on this server yet." };
  }

  try {
    const clerk = await clerkClient();
    const token = await clerk.signInTokens.createSignInToken({ userId, expiresInSeconds: 60 });
    return { ok: true, ticket: token.token, path: target.path, orgId: target.inWorkspace ? orgId : undefined };
  } catch {
    return { ok: false, error: "Couldn't start the demo. Please try again." };
  }
}

/** Where the signed-in person belongs (see getLanding in lib/auth.ts). */
export async function resolveLanding(): Promise<Landing> {
  return getLanding();
}
