"use server";

import { revalidatePath } from "next/cache";
import { checkRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { archiveProjectSchema } from "./schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * "Archive" (Owners only): an active project becomes archived. It stays readable under the
 * Archived filter and no longer counts towards the plan's project limit.
 */
export async function archiveProject(input: unknown): Promise<ActionResult> {
  const access = await checkRole("OWNER");
  if (!access.ok) return access;

  const parsed = archiveProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a project." };

  const { count } = await db.project.updateMany({
    where: { id: parsed.data.projectId, orgId: access.orgId, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });
  if (count === 0) return { ok: false, error: "That project isn't active in your workspace." };

  revalidatePath("/", "layout");
  return { ok: true };
}
