"use server";

import { checkAdmin } from "@/lib/auth";
import { toDateInput } from "@/lib/format";
import { subscribersCsv } from "./queries";
import { subscriberFilterSchema } from "./schemas";

export type CsvResult = { ok: true; csv: string; fileName: string } | { ok: false; error: string };

/**
 * "Export CSV": the subscriber list (with the Subscribers screen's filters and search, if given)
 * as CSV text, downloaded in the browser. SIGNoFF admin only. No email addresses.
 */
export async function exportSubscribersCsv(input: unknown): Promise<CsvResult> {
  const access = await checkAdmin();
  if (!access.ok) return access;

  const parsed = subscriberFilterSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: "Those filters couldn't be read." };

  const csv = await subscribersCsv(parsed.data);
  return { ok: true, csv, fileName: `signoff-subscribers-${toDateInput(new Date())}.csv` };
}
