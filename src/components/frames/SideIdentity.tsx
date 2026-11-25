import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

const squares = {
  peach: "bg-peach text-amber-ink", // agency workspace ("NS")
  client: "bg-peach-2 text-peach-ink", // client company ("BB")
  navy: "bg-ink text-white", // SIGNoFF admin ("So")
} as const;

type SideIdentityProps = {
  initials: string;
  square: keyof typeof squares;
  title: string;
  subtitle: string;
  /** Extra content at the right (the workspace switcher's chevrons). */
  end?: ReactNode;
};

/** 28 px square with initials, a bold name and a small grey line. */
export function SideIdentity({ initials, square, title, subtitle, end }: SideIdentityProps) {
  return (
    <>
      <span
        className={cx(
          "flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
          squares[square],
        )}
      >
        {initials}
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate text-[13px] font-semibold text-ink">{title}</span>
        <span className="truncate text-[11px] text-muted">{subtitle}</span>
      </span>
      {end}
    </>
  );
}
