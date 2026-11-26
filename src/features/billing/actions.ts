"use server";

import { revalidatePath, updateTag } from "next/cache";
import { resetDemoBilling } from "@/features/workspaces/demoReset";
import { isDemoOrg } from "@/features/workspaces/demo";
import { workspaceTag } from "@/features/workspaces/queries";
import { checkRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { billingTag } from "./plans";
import { syncOrgSubscription } from "./sync";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * After checkout or a change in Clerk's subscription details: copy the new subscription into our
 * table straight away (the webhook does the same moments later) and show it on every screen.
 */
export async function refreshBilling(): Promise<ActionResult> {
  const access = await checkRole("MEMBER");
  if (!access.ok) return access;
  await syncOrgSubscription(access.orgId).catch((error) => console.error("refreshBilling: sync failed", error));
  updateTag(billingTag(access.orgId));
  updateTag(workspaceTag(access.orgId));
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Billing's "Reset demo" (demo workspace Owner only): Northfold back to Free. */
export async function resetDemoPlan(): Promise<ActionResult> {
  const access = await checkRole("OWNER");
  if (!access.ok) return access;
  if (!isDemoOrg(access.orgId)) return { ok: false, error: "Only the demo workspace can be reset." };

  try {
    await resetDemoBilling(db);
  } catch (error) {
    console.error("resetDemoPlan failed", error);
    return { ok: false, error: "The demo couldn't be reset. Please try again." };
  }
  updateTag(billingTag(access.orgId));
  revalidatePath("/", "layout");
  return { ok: true };
}
