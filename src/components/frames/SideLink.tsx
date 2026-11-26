"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cx } from "@/components/ui/cx";

const dots: Record<string, string> = {
  violet: "bg-violet",
  amber: "bg-amber",
  green: "bg-green",
  blue: "bg-blue",
  red: "bg-red",
  idle: "bg-idle",
};

type SideLinkProps = {
  href: string;
  /** Dot colour token ("violet", "amber"…), e.g. a project's colour. */
  dot: string;
  title: string;
  subtitle?: string;
  /** Grey number at the right (task count, subscriber count). */
  count?: number;
  /** Amber round badge at the right (deliverables waiting on the client). */
  badge?: number;
  /** Path prefix that selects this link. Omit for inactive links. */
  match?: string;
  exact?: boolean;
  /** No screen behind it yet: shown greyed out, not a link. */
  inactive?: boolean;
};

/** A side-panel row. Selected: soft grey fill and semibold. */
export function SideLink(props: SideLinkProps) {
  if (props.inactive) {
    const { dot, title, count } = props;
    return (
      <span
        aria-disabled="true"
        title="Coming soon"
        className="flex cursor-not-allowed items-center gap-[10px] rounded-control px-[10px] py-2 text-[13px] font-medium text-ink opacity-60"
      >
        <span className={cx("size-2 shrink-0 rounded-[3px]", dots[dot] ?? dots.violet)} />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {count !== undefined && <span className="text-[11px] font-normal text-muted">{count}</span>}
      </span>
    );
  }
  return (
    <Suspense fallback={<SideLinkView {...props} selected={false} />}>
      <SideLinkWithPath {...props} />
    </Suspense>
  );
}

function SideLinkWithPath(props: SideLinkProps) {
  const pathname = usePathname();
  const { match, exact = false } = props;
  const selected = match ? (exact ? pathname === match : pathname === match || pathname.startsWith(`${match}/`)) : false;
  return <SideLinkView {...props} selected={selected} />;
}

function SideLinkView({ href, dot, title, subtitle, count, badge, selected }: SideLinkProps & { selected: boolean }) {

  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className={cx(
        "flex items-center gap-[10px] rounded-control px-[10px] py-2 text-[13px] text-ink hover:text-ink",
        selected ? "bg-soft-2 font-semibold" : "font-medium",
      )}
    >
      <span className={cx("size-2 shrink-0 rounded-[3px]", dots[dot] ?? dots.violet)} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{title}</span>
        {subtitle && <span className="truncate text-[11px] font-normal text-muted">{subtitle}</span>}
      </span>
      {count !== undefined && <span className="text-[11px] font-normal text-muted">{count}</span>}
      {badge !== undefined && badge > 0 && (
        <span className="flex size-[18px] items-center justify-center rounded-full bg-amber text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
