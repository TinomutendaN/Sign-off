"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState, type FormEvent } from "react";
import { errorMessage, finalizeSession, go } from "../clerkFlow";
import { inviteSignUpSchema } from "../schemas";
import { AuthError } from "./AuthError";
import { AuthField } from "./AuthField";
import { AuthFootnote } from "./AuthFootnote";
import { AuthHeading } from "./AuthHeading";
import { AuthSubmit } from "./AuthSubmit";

type InviteSignUpFormProps = {
  /** Clerk's invitation ticket from the link (__clerk_ticket). */
  ticket: string;
  title: string;
  subtitle: string;
  /** The invited address, shown fixed. Unknown for team invites. */
  email: string | null;
  submitLabel: string;
};

/**
 * Sign-up from an invitation link: name and password only. The email comes from the invitation
 * (already verified, so no code step). Afterwards /sign-in/continue opens the person's area:
 * a client's invite is claimed there (portal access), a team member lands in the workspace.
 */
export function InviteSignUpForm({ ticket, title, subtitle, email, submitLabel }: InviteSignUpFormProps) {
  const { signUp } = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = inviteSignUpSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    const [firstName, ...rest] = parsed.data.name.split(/\s+/);
    setBusy(true);
    const { error: createError } = await signUp.create({
      strategy: "ticket",
      ticket,
      firstName,
      lastName: rest.join(" ") || undefined,
      password: parsed.data.password,
    });
    if (createError) {
      setBusy(false);
      return setError(errorMessage(createError));
    }
    if (signUp.status !== "complete") {
      setBusy(false);
      return setError("We couldn't finish creating your account. The invitation may have expired.");
    }

    const { error: finalizeError, decorate } = await finalizeSession(signUp);
    if (finalizeError) {
      setBusy(false);
      return setError(errorMessage(finalizeError));
    }
    go(decorate("/sign-in/continue"));
  }

  return (
    <>
      <AuthHeading title={title} subtitle={subtitle} />
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        {email && <AuthField label="Email" name="email" type="email" value={email} readOnly disabled />}
        <AuthField label="Your name" name="name" autoComplete="name" placeholder="Rudo C." required />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
        />
        <AuthError message={error} />
        <AuthSubmit busy={busy}>{submitLabel}</AuthSubmit>
        <div id="clerk-captcha" className="empty:hidden" />
      </form>
      <AuthFootnote>By creating an account you agree to the terms and privacy policy.</AuthFootnote>
    </>
  );
}
