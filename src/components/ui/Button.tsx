import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type Variant = "primary" | "outline" | "navy";
type Size = "sm" | "bar" | "md" | "block";

const variants: Record<Variant, string> = {
  primary: "bg-violet text-white shadow-violet hover:text-white",
  outline: "border border-line-strong bg-card text-ink shadow-xs hover:text-ink",
  navy: "bg-ink text-white shadow-navy hover:text-white",
};

const sizes: Record<Size, string> = {
  // Header buttons: "Invite a client", "+ New task"
  sm: "gap-2 rounded-control px-[14px] py-[9px] text-[13px]",
  // Top bar: "Try the demo"
  bar: "gap-2 rounded-control px-4 py-[9px] text-sm",
  // Dialog and form buttons: "Upgrade · $190 a year"
  md: "gap-2 rounded-control px-4 py-3 text-sm",
  // Full-width buttons in side-panel cards: "Manage billing"
  block: "w-full gap-2 rounded-lg p-[10px] text-[13px]",
};

type Common = { variant?: Variant; size?: Size; icon?: ReactNode; className?: string; children: ReactNode };
type AsLink = Common & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

/** Violet (primary), outlined, or navy button. Renders a link when given `href`. */
export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "sm", icon, className, children } = props;
  const classes = cx(
    "inline-flex items-center justify-center text-center font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );

  if (props.href !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { variant: _v, size: _s, icon: _i, className: _c, children: _ch, ...rest } = props;
    return (
      <Link className={classes} {...rest}>
        {icon}
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, size: _s, icon: _i, className: _c, children: _ch, href: _h, ...rest } = props;
  return (
    <button type="button" className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
