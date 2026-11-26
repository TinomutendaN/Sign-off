import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * The white app window (10 px padding).
 * App frames (agency, portal, admin): by the owner's request, no lavender border. The window
 * fills the screen edge to edge at every width and the whole page scrolls.
 * Public pages: the lavender page with the rounded window on it (28 px corners), at least as
 * tall as the screen and growing with the page. A page that renders <FlushWindow /> (Pricing)
 * drops the lavender margin and fills the screen too.
 * On phones the window always fills the screen and leaves room for the bottom tab bar.
 */
export function AppWindow({ layout, children }: { layout: "app" | "public"; children: ReactNode }) {
  const flush = layout === "app";
  return (
    <div className={cx("min-h-dvh bg-page phone:p-0 has-[[data-flush-window]]:p-0", flush ? "p-0" : "px-8 py-10")}>
      <div
        className={cx(
          "mx-auto flex gap-[10px] bg-card p-[10px]",
          flush
            ? "min-h-dvh max-w-none"
            : "min-h-[calc(100dvh-80px)] max-w-[1440px] rounded-window border border-line shadow-window",
          "phone:min-h-screen phone:rounded-none phone:border-0 phone:px-2 phone:pt-2 phone:shadow-none",
          "has-[[data-flush-window]]:min-h-dvh has-[[data-flush-window]]:max-w-none has-[[data-flush-window]]:rounded-none has-[[data-flush-window]]:border-0 has-[[data-flush-window]]:shadow-none",
          flush ? "flex-wrap phone:pb-24" : "flex-col phone:pb-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}
