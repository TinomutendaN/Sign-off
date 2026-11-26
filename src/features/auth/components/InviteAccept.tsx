"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { errorMessage, finalizeSession, go } from "../clerkFlow";
import { AuthError } from "./AuthError";
import { AuthFootnote } from "./AuthFootnote";
import { AuthHeading } from "./AuthHeading";
import { AuthSubmit } from "./AuthSubmit";

/**
 * An invitation link for someone who already has an account: one button signs them in with the
 * invitation ticket, then /sign-in/continue claims the invite and opens the right area.
 */
export function InviteAccept({ ticket, subtitle }: { ticket: string; subtitle: string }) {
  const { signIn } = useSignIn();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: ticketError } = await signIn.ticket({ ticket });
    if (ticketError || signIn.status !== "complete") {
      setBusy(false);
      return setError(ticketError ? errorMessage(ticketError) : "We couldn't accept the invitation. Please sign in.");
    }
    const { error: finalizeError, decorate } = await finalizeSession(signIn);
    if (finalizeError) {
      setBusy(false);
      return setError(errorMessage(finalizeError));
    }
    go(decorate("/sign-in/continue"));
  }

  return (
    <>
      <AuthHeading title="Accept your invitation" subtitle={subtitle} />
      <form onSubmit={accept} className="flex flex-col gap-5">
        <AuthError message={error} />
        <AuthSubmit busy={busy}>Accept and sign in</AuthSubmit>
      </form>
      <AuthFootnote>
        Prefer your password? <Link href="/sign-in">Sign in</Link> with the invited email and the invite is still yours.
      </AuthFootnote>
    </>
  );
}
