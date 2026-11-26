"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useSyncExternalStore, type ReactNode } from "react";
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
  /** No screen behind it yet: shown greyed out, not a link. */
  inactive?: boolean;
};

/**
 * One icon-menu item. The selected item is a white tile with a soft shadow and a violet icon.
 * On dynamic routes (/projects/[projectId]) usePathname waits for the request, so while it does
 * the item reads the browser's address instead, keeping the highlight from blinking off.
 * On the server that address is unknown, so the first paint there is unselected.
 */
export function RailLink(props: RailLinkProps) {
  if (props.inactive) return <InactiveRailItem {...props} />;
  return (
    <Suspense fallback={<RailLinkWithBrowserPath {...props} />}>
      <RailLinkWithPath {...props} />
    </Suspense>
  );
}

function isSelected(pathname: string | null, { match = [], exact = false }: RailLinkProps) {
  if (!pathname) return false;
  return match.some((m) => (exact ? pathname === m : pathname === m || pathname.startsWith(`${m}/`)));
}

function RailLinkWithPath(props: RailLinkProps) {
  const pathname = usePathname();
  return <RailLinkView {...props} selected={isSelected(pathname, props)} />;
}

const noSubscribe = () => () => {};

function RailLinkWithBrowserPath(props: RailLinkProps) {
  const pathname = useSyncExternalStore(
    noSubscribe,
    () => window.location.pathname,
    () => null,
  );
  return <RailLinkView {...props} selected={isSelected(pathname, props)} />;
}

function InactiveRailItem({ icon, label, ariaLabel, hideOnPhone = false }: RailLinkProps) {
  return (
    <span
      aria-disabled="true"
      aria-label={label ? undefined : ariaLabel}
      title="Coming soon"
      className={cx(
        "flex cursor-not-allowed items-center rounded-card text-muted opacity-60",
        label ? "w-[60px] flex-col gap-[5px] py-[9px] text-[11px]" : "size-11 justify-center",
        hideOnPhone && "phone:hidden",
      )}
    >
      <span className="flex">{icon}</span>
      {label}
    </span>
  );
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
