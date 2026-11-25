import type { ReactNode } from "react";
import { requireAdmin, requireClient, requireRole } from "@/lib/auth";

/**
 * Renders the page only for people allowed in this area; everyone else is sent to their own.
 * Each route group's layout wraps its pages in this, inside a Suspense boundary
 * (the check reads the session, which only exists at request time).
 */
export async function AccessGate({ area, children }: { area: "agency" | "portal" | "admin"; children: ReactNode }) {
  if (area === "agency") await requireRole("MEMBER");
  else if (area === "portal") await requireClient();
  else await requireAdmin();
  return children;
}
