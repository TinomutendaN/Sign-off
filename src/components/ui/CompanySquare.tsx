import type { AvatarTone } from "./Avatar";
import { cx } from "./cx";

/** "workspace" is the peach NS square with amber text; the rest match the avatar colours. */
export type SquareTone = AvatarTone | "workspace";

const tones: Record<SquareTone, string> = {
  workspace: "bg-peach text-amber-ink",
  peach: "bg-peach-2 text-peach-ink",
  green: "bg-av-ak text-green-ink",
  blue: "bg-av-js text-blue-ink",
  violet: "bg-av-tm text-av-tm-ink",
  red: "bg-av-lr text-red-ink",
  navy: "bg-ink text-white",
  grey: "bg-soft-2 text-ink-3",
};

const sizes = {
  28: "size-7 rounded-lg text-[10px]",
  34: "size-[34px] rounded-control text-[11px]",
  44: "size-11 rounded-card text-sm",
  56: "size-14 rounded-[14px] text-lg",
} as const;

/** A company's initials in a rounded square: a client ("BB") or the workspace ("NS"). */
export function CompanySquare({
  label,
  tone,
  size = 44,
}: {
  label: string;
  tone: SquareTone;
  size?: keyof typeof sizes;
}) {
  return (
    <span className={cx("flex shrink-0 items-center justify-center font-bold", sizes[size], tones[tone])}>
      {label}
    </span>
  );
}
