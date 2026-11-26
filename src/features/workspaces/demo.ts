import { headers } from "next/headers";

// The public demo workspace (Northfold Studio). Anyone can enter it from the demo cards, so it
// never makes Clerk email an address a visitor typed: invites there are created with email
// turned off and the agency gets a copyable link instead. The demo reset removes them.

/** Whether this workspace is the public demo workspace (DEMO_ORG_ID). */
export function isDemoOrg(orgId: string) {
  return orgId === process.env.DEMO_ORG_ID?.trim();
}

/** This site's address as the visitor reached it: "https://sign-off.vercel.app". */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
