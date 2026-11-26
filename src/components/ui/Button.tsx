import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type Variant = "primary" | "outline" | "navy" | "light" | "on-navy";
type Size = "sm" | "bar" | "md" | "lg" | "block";

const variants: Record<Variant, string> = {
  // Violet glow is set by size below (bigger under the large Landing button).
  primary: "bg-violet text-white hover:text-white",
  outline: "border border-line-strong bg-card text-ink shadow-xs hover:text-ink",
  navy: "bg-ink text-white shadow-navy hover:text-white",
  // On the navy closing band: white "Start free" and outlined "Try the demo"
  light: "bg-card text-ink hover:text-ink",
  "on-navy": "border border-navy-line text-white hover:text-white",
};

const sizes: Record<Size, string> = {
  // Header buttons: "Invite a client", "+ New task"
  sm: "gap-2 rounded-control px-[14px] py-[9px] text-[13px]",
  // Top bar: "Try the demo"
  bar: "gap-2 rounded-control px-4 py-[9px] text-sm",
  // Dialog and form buttons: "Upgrade · $189.96 a year"
  md: "gap-2 rounded-control px-4 py-3 text-sm",
  // Landing calls to action: "Try the demo →", "See pricing", "Start free"
  lg: "gap-2 rounded-card px-5 py-[13px] text-[15px]",
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
    variant === "primary" && (size === "lg" ? "shadow-violet-lg" : "shadow-violet"),
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
