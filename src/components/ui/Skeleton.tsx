import { cx } from "./cx";

/** A soft grey placeholder block shown while a page loads (pulses gently unless reduced motion is on). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("rounded-control bg-soft-2 motion-safe:animate-pulse", className)} />;
}
