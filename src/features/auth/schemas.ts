import { z } from "zod";
import { PAID_PLANS, PERIODS } from "@/features/billing/plans";

/** The four demo role cards. The browser only ever sends one of these keys, never a user ID. */
export const demoRoleSchema = z.enum(["owner", "member", "client", "admin"]);
export type DemoRole = z.infer<typeof demoRoleSchema>;

/** A plan chosen on Pricing: /sign-up?plan=pro&period=annual. */
export const chosenPlanSchema = z.object({
  plan: z.enum(PAID_PLANS),
  period: z.enum(PERIODS),
});
export type ChosenPlan = z.infer<typeof chosenPlanSchema>;

const workspaceName = z
  .string()
  .trim()
  .min(2, "Enter your workspace name.")
  .max(60, "Keep the workspace name under 60 characters.");

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Keep your name under 80 characters."),
  workspaceName,
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters for your password."),
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const workspaceSchema = z.object({ workspaceName });

export const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});
