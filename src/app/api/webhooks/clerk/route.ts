import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { billingTag } from "@/features/billing/plans";
import { syncOrgSubscription } from "@/features/billing/sync";

// Clerk webhooks (public route; the signature is the only check, see src/proxy.ts).
// Billing events (subscription.*, subscriptionItem.*, paymentAttempt.*) only tell us which
// workspace changed: syncOrgSubscription re-reads its current subscription from Clerk, so a
// repeated or out-of-order delivery changes nothing. Other events are acknowledged and ignored.
// Client invites need no webhook: they're claimed when the invited person first signs in.

const BILLING = /^(subscription|subscriptionItem|paymentAttempt)\./;

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Verification failed", { status: 400 });
  }

  if (!BILLING.test(evt.type)) return new Response("Ignored", { status: 200 });

  const payer = (evt.data as { payer?: { organization_id?: string | null } }).payer;
  const orgId = payer?.organization_id;
  if (!orgId) return new Response("Not a workspace subscription", { status: 200 });

  try {
    const result = await syncOrgSubscription(orgId);
    revalidateTag(billingTag(orgId), { expire: 0 });
    console.log(`Clerk ${evt.type}: ${result.orgId} → ${result.plan} (${result.status})`);
    return Response.json(result);
  } catch (error) {
    console.error(`Clerk ${evt.type}: sync failed for ${orgId}`, error);
    // A 500 makes Clerk retry the delivery later.
    return new Response("Sync failed", { status: 500 });
  }
}
