import { revalidatePath, revalidateTag } from "next/cache";
import { billingTag } from "@/features/billing/plans";
import { workspaceTag } from "@/features/workspaces/queries";
import { db } from "@/lib/db";

// Nightly demo reset, called by Vercel Cron (vercel.json) with `Authorization: Bearer CRON_SECRET`.
// Runs the same full reset as `npx prisma db seed`: Northfold back to Free, visitors' uploads
// and Clerk changes removed, the demo data rebuilt on today's date.

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Loaded here, not at the top, so the build never runs the reset's setup.
  const { runDemoReset } = await import("@/features/workspaces/demoSeed");
  try {
    const report = await runDemoReset(db);
    const orgId = process.env.DEMO_ORG_ID!.trim();
    revalidateTag(billingTag(orgId), { expire: 0 });
    revalidateTag(workspaceTag(orgId), { expire: 0 });
    revalidatePath("/", "layout");
    return Response.json({ ok: true, ...report });
  } catch (error) {
    console.error("Demo reset failed", error);
    return Response.json({ ok: false, error: "The demo reset failed. See the function logs." }, { status: 500 });
  }
}
