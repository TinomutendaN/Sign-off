import type { ComponentProps } from "react";
import { cx } from "./cx";

type PanelProps = ComponentProps<"div"> & {
  /** "panel" = 20 px (frames, big panels), "column" = 18 px (Kanban columns, side panels on screens). */
  radius?: "panel" | "column" | "side";
};

/** Grey #E8E7F0 panel. */
export function Panel({ radius = "column", className, ...rest }: PanelProps) {
  const corners = { panel: "rounded-panel", column: "rounded-column", side: "rounded-side" }[radius];
  return <div className={cx("bg-panel", corners, className)} {...rest} />;
}
