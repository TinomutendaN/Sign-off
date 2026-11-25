import type { ReactNode } from "react";

/** The small centred grey line under the submit button. */
export function AuthFootnote({ children }: { children: ReactNode }) {
  return <p className="m-0 text-center text-xs leading-normal text-muted">{children}</p>;
}
