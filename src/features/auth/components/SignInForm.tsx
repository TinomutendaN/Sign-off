"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { errorMessage, finalizeSession, go } from "../clerkFlow";
import { signInSchema } from "../schemas";
import { AuthError } from "./AuthError";
import { AuthField } from "./AuthField";
import { AuthFootnote } from "./AuthFootnote";
import { AuthHeading } from "./AuthHeading";
import { AuthModeSwitch } from "./AuthModeSwitch";
import { AuthSubmit } from "./AuthSubmit";
import { CodeStep } from "./CodeStep";

/** Where every sign-in goes next: the server picks the person's area and workspace. */
const CONTINUE_PATH = "/sign-in/continue";

/**
 * "Sign in": email and password through Clerk's useSignIn. On a new device Clerk may ask
 * for an email code first (device trust); that uses the same code step as sign-up.
 */
export function SignInForm({ query }: { query: string }) {
  const { signIn } = useSignIn();
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function complete(): Promise<string | null> {
    const { error: finalizeError, decorate } = await finalizeSession(signIn);
    if (finalizeError) return errorMessage(finalizeError);
    go(decorate(CONTINUE_PATH));
    return null;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    setBusy(true);
    const { error: passwordError } = await signIn.password({
      emailAddress: parsed.data.email,
      password: parsed.data.password,
    });
    if (passwordError) {
      setBusy(false);
      return setError(errorMessage(passwordError));
    }
    setEmail(parsed.data.email);

    if (signIn.status === "complete") {
      const failed = await complete();
      if (failed) {
        setBusy(false);
        setError(failed);
      }
      return;
    }

    const needsCode = signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor";
    if (needsCode && signIn.supportedSecondFactors.some((f) => f.strategy === "email_code")) {
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      setBusy(false);
      if (sendError) return setError(errorMessage(sendError));
      return setStep("code");
    }

    setBusy(false);
    setError("This account needs a sign-in step SIGNoFF doesn't support yet.");
  }

  async function verify(code: string) {
    const { error: verifyError } = await signIn.mfa.verifyEmailCode({ code });
    if (verifyError) return errorMessage(verifyError);
    if (signIn.status !== "complete") return "We couldn't sign you in. Please try again.";
    return complete();
  }

  async function resend() {
    const { error: sendError } = await signIn.mfa.sendEmailCode();
    return sendError ? errorMessage(sendError) : null;
  }

  async function startOver() {
    await signIn.reset();
    setStep("form");
  }

  if (step === "code") {
    return <CodeStep email={email} onVerify={verify} onResend={resend} onBack={startOver} />;
  }

  return (
    <>
      <AuthHeading title="Welcome back" subtitle="Sign in to your SIGNoFF workspace." />
      <AuthModeSwitch mode="signin" query={query} />
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@studio.com" required />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="At least 8 characters"
          required
          aside={
            // Password reset isn't part of the 60-hour build; the link stays visible as designed.
            <span aria-disabled="true" title="Password reset isn't available in the demo" className="text-violet-icon">
              Forgot password?
            </span>
          }
        />
        <AuthError message={error} />
        <AuthSubmit busy={busy}>Sign in</AuthSubmit>
      </form>
      <AuthFootnote>Clients: use the invite link your agency sent you.</AuthFootnote>
    </>
  );
}
