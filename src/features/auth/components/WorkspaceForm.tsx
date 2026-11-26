"use client";

import { SignOutButton, useClerk } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { errorMessage, go, openWorkspace } from "../clerkFlow";
import { workspaceSchema, type ChosenPlan } from "../schemas";
import { AuthError } from "./AuthError";
import { AuthField } from "./AuthField";
import { AuthFootnote } from "./AuthFootnote";
import { AuthHeading } from "./AuthHeading";
import { AuthSubmit } from "./AuthSubmit";
import { PlanNote } from "./PlanNote";
import { afterWorkspaceUrl } from "../afterWorkspace";

type WorkspaceFormProps = {
  plan: ChosenPlan | null;
  /** The name typed at sign-up, if they left before the workspace was made. */
  defaultName: string;
  /** "Tino M.", shown so people know which account they're in. */
  personName: string;
};

/**
 * "Create your workspace" for someone already signed in with no workspace and no client
 * access. Creates the Clerk organization (they become Owner), makes it active, and opens /dashboard,
 * or Billing with checkout for the plan they chose on Pricing.
 */
export function WorkspaceForm({ plan, defaultName, personName }: WorkspaceFormProps) {
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = workspaceSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    setBusy(true);
    try {
      const org = await clerk.createOrganization({ name: parsed.data.workspaceName });
      await openWorkspace(clerk, org.id);
      go(afterWorkspaceUrl(plan));
    } catch (err) {
      setBusy(false);
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <AuthHeading title="Create your workspace" subtitle="Set up SIGNoFF for your studio in a minute." />
      {plan && <PlanNote plan={plan} />}
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <AuthField
          label="Workspace name"
          name="workspaceName"
          autoComplete="organization"
          placeholder="Northfold Studio"
          defaultValue={defaultName}
          required
          autoFocus
        />
        <AuthError message={error} />
        <AuthSubmit busy={busy}>{plan ? "Create workspace and continue to payment" : "Create workspace"}</AuthSubmit>
      </form>
      <AuthFootnote>
        Signed in as {personName}.{" "}
        <SignOutButton redirectUrl="/sign-in">
          <button type="button" className="font-medium text-violet-icon hover:text-violet-ink">
            Sign out
          </button>
        </SignOutButton>
      </AuthFootnote>
    </>
  );
}
