"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";

type RailLinkProps = {
  href: string;
  icon: ReactNode;
  /** Shown under the icon. Without it the item is a 44 px icon-only tile (Help, Settings). */
  label?: string;
  /** Accessible name for icon-only tiles. */
  ariaLabel?: string;
  /** Path prefixes that select this item. Empty = never selected (inactive "#" links). */
  match?: string[];
  /** Match the path exactly instead of by prefix. */
  exact?: boolean;
  hideOnPhone?: boolean;
};

/**
 * One icon-menu item. The selected item is a white tile with a soft shadow and a violet icon.
 * On dynamic routes the path is only known at request time, so the item first renders unselected.
 */
export function RailLink(props: RailLinkProps) {
  return (
    <Suspense fallback={<RailLinkView {...props} selected={false} />}>
      <RailLinkWithPath {...props} />
    </Suspense>
  );
}

function RailLinkWithPath(props: RailLinkProps) {
  const pathname = usePathname();
  const { match = [], exact = false } = props;
  const selected = match.some((m) => (exact ? pathname === m : pathname === m || pathname.startsWith(`${m}/`)));
  return <RailLinkView {...props} selected={selected} />;
}

function RailLinkView({ href, icon, label, ariaLabel, hideOnPhone = false, selected }: RailLinkProps & { selected: boolean }) {

  return (
    <Link
      href={href}
      aria-label={label ? undefined : ariaLabel}
      aria-current={selected ? "page" : undefined}
      className={cx(
        "flex items-center rounded-card",
        label ? "w-[60px] flex-col gap-[5px] py-[9px] text-[11px]" : "size-11 justify-center",
        selected ? "bg-card shadow-tile" : "",
        selected && label ? "font-medium text-ink hover:text-ink" : "",
        selected && !label ? "text-violet-icon hover:text-violet-icon" : "",
        !selected ? "text-muted hover:text-ink" : "",
        hideOnPhone && "phone:hidden",
      )}
    >
      <span className={cx("flex", selected && "text-violet-icon")}>{icon}</span>
      {label}
    </Link>
  );
}
