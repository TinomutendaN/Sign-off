"use client";

import { useClerk, useSignUp } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { errorMessage, finalizeSession, go, openWorkspace } from "../clerkFlow";
import { signUpSchema, type ChosenPlan } from "../schemas";
import { AuthError } from "./AuthError";
import { AuthField } from "./AuthField";
import { AuthFootnote } from "./AuthFootnote";
import { AuthHeading } from "./AuthHeading";
import { AuthModeSwitch } from "./AuthModeSwitch";
import { AuthSubmit } from "./AuthSubmit";
import { CodeStep } from "./CodeStep";
import { PlanNote } from "./PlanNote";
import { afterWorkspaceUrl } from "../afterWorkspace";

type SignUpFormProps = { plan: ChosenPlan | null; query: string };

/**
 * "Create account": name, workspace name, email and password through Clerk's useSignUp,
 * then the email code if Clerk asks for it. Finishing creates the person's workspace
 * (a Clerk organization, with them as Owner), makes it active and opens /dashboard.
 */
export function SignUpForm({ plan, query }: SignUpFormProps) {
  const { signUp } = useSignUp();
  const clerk = useClerk();
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Activates the session, creates the workspace and opens it. Returns an error message or null. */
  async function complete(name: string): Promise<string | null> {
    const { error: finalizeError, decorate } = await finalizeSession(signUp);
    if (finalizeError) return errorMessage(finalizeError);
    try {
      const org = await clerk.createOrganization({ name });
      await openWorkspace(clerk, org.id);
      go(decorate(afterWorkspaceUrl(plan)));
    } catch {
      // The account exists; the "Create your workspace" state lets them try the workspace again.
      go(decorate("/sign-up"));
    }
    return null;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    const { name, workspaceName: workspace, email: address, password } = parsed.data;
    const [firstName, ...rest] = name.split(/\s+/);
    setBusy(true);

    const { error: createError } = await signUp.password({
      emailAddress: address,
      password,
      firstName,
      lastName: rest.join(" ") || undefined,
      unsafeMetadata: { workspaceName: workspace },
    });
    if (createError) {
      setBusy(false);
      return setError(errorMessage(createError));
    }

    setEmail(address);
    setWorkspaceName(workspace);

    if (signUp.status === "complete") {
      const failed = await complete(workspace);
      if (failed) {
        setBusy(false);
        setError(failed);
      }
      return;
    }

    if (signUp.unverifiedFields.includes("email_address")) {
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      setBusy(false);
      if (sendError) return setError(errorMessage(sendError));
      return setStep("code");
    }

    setBusy(false);
    setError("We couldn't finish creating your account. Please try again.");
  }

  async function verify(code: string) {
    const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
    if (verifyError) return errorMessage(verifyError);
    if (signUp.status !== "complete") return "We couldn't finish creating your account. Please try again.";
    return complete(workspaceName);
  }

  async function resend() {
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    return sendError ? errorMessage(sendError) : null;
  }

  async function startOver() {
    await signUp.reset();
    setStep("form");
  }

  if (step === "code") {
    return <CodeStep email={email} onVerify={verify} onResend={resend} onBack={startOver} />;
  }

  return (
    <>
      <AuthHeading title="Create your workspace" subtitle="Set up SIGNoFF for your studio in a minute." />
      <AuthModeSwitch mode="signup" query={query} />
      {plan && <PlanNote plan={plan} />}
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <AuthField label="Your name" name="name" autoComplete="name" placeholder="Tino M." required />
        <AuthField
          label="Workspace name"
          name="workspaceName"
          autoComplete="organization"
          placeholder="Northfold Studio"
          required
        />
        <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@studio.com" required />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
        />
        <AuthError message={error} />
        <AuthSubmit busy={busy}>{plan ? "Create account and continue to payment" : "Create account"}</AuthSubmit>
        {/* Clerk's bot protection mounts here when it's turned on. */}
        <div id="clerk-captcha" className="empty:hidden" />
      </form>
      <AuthFootnote>By creating an account you agree to the terms and privacy policy.</AuthFootnote>
    </>
  );
}
