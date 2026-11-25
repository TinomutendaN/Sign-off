"use client";

import { useState, type FormEvent } from "react";
import { codeSchema } from "../schemas";
import { AuthError } from "./AuthError";
import { AuthField } from "./AuthField";
import { AuthFootnote } from "./AuthFootnote";
import { AuthHeading } from "./AuthHeading";
import { AuthSubmit } from "./AuthSubmit";

type CodeStepProps = {
  email: string;
  /** Returns an error message, or null when the code was accepted. */
  onVerify: (code: string) => Promise<string | null>;
  onResend: () => Promise<string | null>;
  onBack: () => void;
};

/** The email code step Clerk may ask for after sign-up or on a new device. */
export function CodeStep({ email, onVerify, onResend, onBack }: CodeStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const parsed = codeSchema.safeParse({ code: new FormData(e.currentTarget).get("code") });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    const failed = await onVerify(parsed.data.code);
    if (failed) {
      setError(failed);
      setBusy(false);
    }
    // On success the page navigates away; keep the button busy until it does.
  }

  async function resend() {
    setError(null);
    const failed = await onResend();
    if (failed) setError(failed);
    else setNotice("We sent a new code.");
  }

  return (
    <>
      <AuthHeading title="Check your email" subtitle={`We sent a 6-digit code to ${email}.`} />
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <AuthField
          label="Code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6-digit code"
          autoFocus
        />
        <AuthError message={error} />
        {notice && <p className="m-0 text-[13px] text-green-ink">{notice}</p>}
        <AuthSubmit busy={busy}>Verify and continue</AuthSubmit>
      </form>
      <div className="flex justify-center gap-4 text-[13px] font-medium">
        <button type="button" onClick={resend} className="text-violet-icon hover:text-violet-ink">
          Send a new code
        </button>
        <button type="button" onClick={onBack} className="text-muted hover:text-ink">
          Use a different email
        </button>
      </div>
      {email.includes("+clerk_test") && <AuthFootnote>Test email: the code is 424242.</AuthFootnote>}
    </>
  );
}
