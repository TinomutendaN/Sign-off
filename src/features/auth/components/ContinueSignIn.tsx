"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { resolveLanding } from "../actions";
import { go, openWorkspace } from "../clerkFlow";
import { AuthError } from "./AuthError";
import { AuthHeading } from "./AuthHeading";

/**
 * The moment after signing in: asks the server where this person belongs, makes their
 * workspace active if they're on a team (only the browser can do that), then opens it.
 */
export function ContinueSignIn() {
  const { isLoaded, orgId } = useAuth();
  const clerk = useClerk();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || started.current) return;
    started.current = true;
    (async () => {
      try {
        const landing = await resolveLanding();
        if (landing.orgId && landing.orgId !== orgId) await openWorkspace(clerk, landing.orgId);
        go(landing.path);
      } catch {
        setError("We couldn't open your workspace. Please refresh the page.");
      }
    })();
  }, [isLoaded, orgId, clerk]);

  return (
    <>
      <AuthHeading title="Signing you in" subtitle="Opening your workspace…" />
      <AuthError message={error} />
    </>
  );
}
