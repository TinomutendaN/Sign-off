import { cx } from "./cx";

export type BarTone = "violet" | "violet-bar" | "amber" | "green" | "blue" | "red" | "idle";

const bars: Record<BarTone, string> = {
  violet: "bg-violet",
  "violet-bar": "bg-violet-bar",
  amber: "bg-amber",
  green: "bg-green",
  blue: "bg-blue",
  red: "bg-red",
  idle: "bg-idle",
};

const tracks = { white: "bg-card", track: "bg-track", soft: "bg-soft-2" } as const;
const heights = { 5: "h-[5px] rounded-[3px]", 6: "h-1.5 rounded-[3px]", 7: "h-[7px] rounded-[4px]", 8: "h-2 rounded-[4px]" } as const;

type ProgressBarProps = {
  /** 0–100 */
  value: number;
  tone?: BarTone;
  track?: keyof typeof tracks;
  height?: keyof typeof heights;
  className?: string;
  label?: string;
};

export function ProgressBar({ value, tone = "violet", track = "track", height = 6, className, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      className={cx(tracks[track], heights[height], className)}
    >
      <div className={cx(bars[tone], heights[height])} style={{ width: `${pct}%` }} />
    </div>
  );
}
