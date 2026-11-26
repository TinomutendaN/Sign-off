import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

type ApprovalSummaryCardProps = {
  href: string;
  title: string;
  /** "Website redesign · Sent 22 Nov by Leo R." */
  meta: string;
  note: string | null;
  /** The 120×80 file preview. */
  thumbnail: ReactNode;
};

/** Client home: one deliverable waiting on the client, linking to its project's review card. */
export function ApprovalSummaryCard({ href, title, meta, note, thumbnail }: ApprovalSummaryCardProps) {
  return (
    <article className="flex flex-wrap items-center gap-4 rounded-card bg-card p-4 shadow-card">
      {thumbnail}
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
        <span className="text-base font-semibold text-ink">{title}</span>
        <span className="text-[13px] text-muted">{meta}</span>
        {note && <span className="text-[13px] text-ink-2">&ldquo;{note}&rdquo;</span>}
      </div>
      <Link
        href={href}
        className="flex items-center gap-2 rounded-control bg-violet px-[18px] py-[11px] text-sm font-medium text-white shadow-violet hover:text-white phone:w-full phone:justify-center"
      >
        Review and approve
        <ArrowRightIcon />
      </Link>
    </article>
  );
}
