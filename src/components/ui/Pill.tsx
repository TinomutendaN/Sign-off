import type { ComponentProps } from "react";
import { cx } from "./cx";

export type PillTone = "amber" | "green" | "red" | "blue" | "progress" | "violet" | "grey" | "white";

const tones: Record<PillTone, string> = {
  amber: "bg-amber-tint text-amber-ink", // Waiting on client
  green: "bg-green-tint text-green-ink", // Approved, On track, Active
  red: "bg-red-tint text-red-ink", // Changes requested, Cancelled
  blue: "bg-blue-tint text-blue-ink", // Build type
  progress: "bg-blue-soft text-blue-ink", // In progress
  violet: "bg-violet-tint text-violet-ink", // Owner, small labels
  grey: "bg-soft-2 text-ink-3", // Team member, To do
  white: "bg-card text-ink-3", // Up next (on grey)
};

type PillProps = ComponentProps<"span"> & { tone: PillTone; size?: "sm" | "md" };

/** Fully rounded status pill. `sm` = 3×8 padding (milestone boxes), `md` = 4×8 (cards). */
export function Pill({ tone, size = "sm", className, ...rest }: PillProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full text-[11px] font-semibold",
        size === "sm" ? "px-2 py-[3px]" : "px-2 py-1",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
