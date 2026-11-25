// Small helpers shared by the sign-in, sign-up and demo flows (browser only).

type Navigate = (params: { decorateUrl: (url: string) => string }) => void;
/** A Clerk sign-in or sign-up. Called as a method so it keeps its own `this`. */
type Finalizable = { finalize: (params?: { navigate?: Navigate }) => Promise<{ error: unknown }> };

/**
 * Makes the new session active. We navigate ourselves afterwards (after opening a workspace
 * if needed), but keep Clerk's `decorateUrl` so Safari's tracking protection still gets its
 * cookie refresh.
 */
export async function finalizeSession(resource: Finalizable) {
  let decorate = (url: string) => url;
  const { error } = await resource.finalize({
    navigate: ({ decorateUrl }) => {
      decorate = decorateUrl;
    },
  });
  return { error, decorate };
}

/** A full page load, so the server sees the new session and workspace straight away. */
export function go(url: string) {
  window.location.assign(url);
}

/** A readable message from a Clerk error (API errors carry their detail in `errors[0]`). */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error || typeof error !== "object") return fallback;
  const e = error as {
    longMessage?: string;
    errors?: { longMessage?: string; message?: string }[];
  };
  return e.errors?.[0]?.longMessage ?? e.errors?.[0]?.message ?? e.longMessage ?? fallback;
}

type WorkspaceOpener = {
  setActive: (params: { organization: string }) => Promise<void>;
  session?: { touch: (params?: { intent?: "select_org" }) => Promise<unknown> } | null;
};

/**
 * Makes a workspace active and saves that choice with Clerk. `setActive` alone only updates
 * the session token in this tab; without the `touch`, the next full page load comes back with
 * no workspace selected (seen with @clerk/nextjs 7.10.8 / clerk-js 6.46).
 */
export async function openWorkspace(clerk: WorkspaceOpener, orgId: string) {
  await clerk.setActive({ organization: orgId });
  await clerk.session?.touch({ intent: "select_org" });
}
