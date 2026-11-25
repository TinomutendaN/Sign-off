import type { ComponentProps } from "react";
import { cx } from "@/components/ui/cx";

/** The bordered card at the bottom of the side panel (plan, agency contact, test mode). */
export function SideCard({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "relative flex flex-col gap-[10px] rounded-side border border-panel bg-card p-[14px] shadow-side-card",
        className,
      )}
      {...rest}
    />
  );
}
