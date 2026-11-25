import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * The lavender page with the white app window on it (28 px corners, 10 px padding).
 * On phones the window fills the screen and leaves room for the bottom tab bar.
 */
export function AppWindow({ layout, children }: { layout: "app" | "public"; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page px-8 py-10 phone:p-0">
      <div
        className={cx(
          "mx-auto flex max-w-[1440px] gap-[10px] rounded-window border border-line bg-card p-[10px] shadow-window",
          "phone:min-h-screen phone:rounded-none phone:border-0 phone:px-2 phone:pt-2 phone:shadow-none",
          layout === "app" ? "flex-wrap phone:pb-24" : "flex-col phone:pb-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}
