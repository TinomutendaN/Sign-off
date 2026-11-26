import Link from "next/link";
import type { ReactNode } from "react";

type PagerProps = {
  summary: string;
  /** Links to the previous and next pages; null when there is none. */
  previous: string | null;
  next: string | null;
};

function PageButton({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        className="cursor-not-allowed rounded-switch border border-line-muted bg-soft px-3 py-[7px] text-[13px] text-faint"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className="rounded-switch bg-card px-3 py-[7px] text-[13px] font-medium text-ink shadow-switch hover:text-ink"
    >
      {children}
    </Link>
  );
}

/** "Showing the 10 newest of 205" with Previous and Next. */
export function Pager({ summary, previous, next }: PagerProps) {
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center gap-3 px-2 py-1">
      <span className="flex-1 text-xs text-muted" aria-live="polite">
        {summary}
      </span>
      <PageButton href={previous}>Previous</PageButton>
      <PageButton href={next}>Next</PageButton>
    </nav>
  );
}
