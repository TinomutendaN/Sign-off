import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * The lavender page with the white app window on it (28 px corners, 10 px padding).
 * The window is always at least as tall as the screen (minus the 40 px margins), so the grey
 * frame reaches the bottom and short pages never look cut off; long pages grow past it.
 * On phones the window fills the screen and leaves room for the bottom tab bar.
 * A page that renders <FlushWindow /> (Pricing) drops the lavender margin and fills the screen at every width.
 */
export function AppWindow({ layout, children }: { layout: "app" | "public"; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-page px-8 py-10 phone:p-0 has-[[data-flush-window]]:p-0">
      <div
        className={cx(
          "mx-auto flex min-h-[calc(100dvh-80px)] max-w-[1440px] gap-[10px] rounded-window border border-line bg-card p-[10px] shadow-window",
          "phone:min-h-screen phone:rounded-none phone:border-0 phone:px-2 phone:pt-2 phone:shadow-none",
          "has-[[data-flush-window]]:min-h-dvh has-[[data-flush-window]]:max-w-none has-[[data-flush-window]]:rounded-none has-[[data-flush-window]]:border-0 has-[[data-flush-window]]:shadow-none",
          layout === "app" ? "flex-wrap phone:pb-24" : "flex-col phone:pb-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}
