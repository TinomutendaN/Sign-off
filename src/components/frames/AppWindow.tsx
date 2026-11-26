import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * The lavender page with the white app window on it (28 px corners, 10 px padding).
 * App frames (agency, portal, admin): on laptop and tablet the window is exactly the screen's
 * height (minus the 40 px margins) and stays put; only the page content inside it scrolls
 * (see AppShell), so the rounded window and the menus never scroll away.
 * Public pages: the window is at least as tall as the screen and grows with the page.
 * On phones the window fills the screen, the page scrolls normally and leaves room for the bottom tab bar.
 * A page that renders <FlushWindow /> (Pricing) drops the lavender margin and fills the screen at every width.
 */
export function AppWindow({ layout, children }: { layout: "app" | "public"; children: ReactNode }) {
  return (
    <div
      className={cx(
        "min-h-dvh bg-page px-8 py-10 phone:p-0 has-[[data-flush-window]]:p-0",
        layout === "app" && "h-dvh overflow-hidden phone:h-auto phone:overflow-visible",
      )}
    >
      <div
        className={cx(
          "mx-auto flex min-h-[calc(100dvh-80px)] max-w-[1440px] gap-[10px] rounded-window border border-line bg-card p-[10px] shadow-window",
          "phone:min-h-screen phone:rounded-none phone:border-0 phone:px-2 phone:pt-2 phone:shadow-none",
          "has-[[data-flush-window]]:min-h-dvh has-[[data-flush-window]]:max-w-none has-[[data-flush-window]]:rounded-none has-[[data-flush-window]]:border-0 has-[[data-flush-window]]:shadow-none",
          layout === "app"
            ? "h-full min-h-0 flex-nowrap phone:h-auto phone:min-h-screen phone:flex-wrap phone:pb-24"
            : "flex-col phone:pb-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}
