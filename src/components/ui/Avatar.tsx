import { initials, type AvatarTone as BaseTone } from "@/lib/format";
import { cx } from "./cx";

export type AvatarTone = BaseTone | "peach" | "navy";

const tones: Record<AvatarTone, string> = {
  violet: "bg-av-tm text-av-tm-ink",
  green: "bg-av-ak text-green-ink",
  red: "bg-av-lr text-red-ink",
  blue: "bg-av-js text-blue-ink",
  peach: "bg-peach-2 text-peach-ink",
  navy: "bg-ink text-white",
};

const sizes = {
  26: "size-[26px] text-[10px]",
  28: "size-7 text-[10px]",
  32: "size-8 text-[11px]",
  36: "size-9 text-xs",
} as const;

export type AvatarPerson = { firstName?: string | null; lastName?: string | null };

type AvatarProps = {
  person: AvatarPerson;
  tone?: AvatarTone;
  size?: keyof typeof sizes;
  /** 2 px white ring, for overlapping stacks. */
  ring?: boolean;
  className?: string;
};

/** Round initials avatar ("Leo R." → "LR"). Never shows a photo or an email. */
export function Avatar({ person, tone = "violet", size = 32, ring = false, className }: AvatarProps) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizes[size],
        tones[tone],
        ring && "border-2 border-card",
        className,
      )}
    >
      {initials(person)}
    </span>
  );
}
