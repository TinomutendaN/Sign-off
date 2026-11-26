import { z } from "zod";

// The Subscribers screen's filters, search and page. Used by the page (from the URL) and the
// CSV export action. Bad or missing values fall back to the defaults instead of failing.
export const subscriberFilterSchema = z.object({
  plan: z.enum(["all", "pro", "agency"]).catch("all"),
  status: z.enum(["all", "active", "cancelled"]).catch("all"),
  q: z
    .string()
    .trim()
    .max(80)
    .catch("")
    .default(""),
  page: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
});

export type SubscriberFilter = z.infer<typeof subscriberFilterSchema>;

/** The Admin dashboard's revenue chart range, from ?range=. */
export const rangeSchema = z.enum(["3", "6", "12"]).catch("12");
