"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { DecisionKind } from "@/generated/prisma/enums";
import { CheckIcon, DownloadIcon, PencilIcon } from "@/components/icons";
import { Field } from "@/components/ui/Field";
import { decideDeliverable } from "@/features/deliverables/actions";
import { CHANGES_COMMENT_REQUIRED } from "@/features/deliverables/decisions";

type ApprovalCardProps = {
  projectId: string;
  deliverableId: string;
  title: string;
  /** "homepage-v2.pdf · 4.2 MB · Sent 22 Nov by Leo R." */
  fileLine: string;
  note: string | null;
  fileName: string;
  downloadHref: string;
  agencyName: string;
  /** The large preview box (rendered on the server). */
  preview: ReactNode;
  /** Set once the client has decided: the confirmation replaces the comment box and buttons. */
  decided: DecisionKind | null;
};

/** Client project view: one deliverable to review, with Approve and Request changes. Decisions are final. */
export function ApprovalCard(props: ApprovalCardProps) {
  const { projectId, deliverableId, title, fileLine, note, fileName, downloadHref, agencyName, preview } = props;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justDecided, setJustDecided] = useState<DecisionKind | null>(null);
  const decided = justDecided ?? props.decided;

  function decide(kind: DecisionKind) {
    if (kind === "CHANGES_REQUESTED" && !comment.trim()) {
      setError(CHANGES_COMMENT_REQUIRED);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await decideDeliverable({ projectId, deliverableId, kind, comment: comment.trim() || undefined });
      if (!result.ok) {
        setError(result.error);
        router.refresh();
        return;
      }
      setJustDecided(kind);
      // Keeps this card (with its confirmation) on the page after the refresh.
      router.replace(`/portal/projects/${projectId}?decided=${deliverableId}`, { scroll: false });
    });
  }

  return (
    <article className="flex flex-wrap gap-5 rounded-card bg-card p-4 shadow-card">
      {preview}
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3">
        <span className="h-1 w-[30px] rounded-[2px] bg-amber" />
        <div className="flex flex-col gap-1">
          <div className="text-[17px] font-semibold text-ink">{title}</div>
          <div className="text-xs text-muted">{fileLine}</div>
        </div>
        {note && (
          <div className="rounded-control bg-soft px-3 py-[10px] text-[13px] leading-normal text-ink-2">&ldquo;{note}&rdquo;</div>
        )}
        <a href={downloadHref} download={fileName} className="flex items-center gap-1.5 self-start text-[13px] font-medium">
          <DownloadIcon size={15} />
          Download file
        </a>

        {decided === "APPROVED" && (
          <div role="status" className="flex items-center gap-[10px] rounded-control bg-green-tint px-[14px] py-3 text-[13px] font-medium text-green-ink">
            <CheckIcon size={18} />
            <span className="flex-1">You approved this. {agencyName} has been told.</span>
          </div>
        )}
        {decided === "CHANGES_REQUESTED" && (
          <div role="status" className="flex items-center gap-[10px] rounded-control bg-amber-tint px-[14px] py-3 text-[13px] font-medium text-amber-ink">
            <PencilIcon size={18} />
            <span className="flex-1">Changes requested. The team will send a new version.</span>
          </div>
        )}

        {!decided && (
          <>
            <Field
              multiline
              label="Comment (needed if you ask for changes)"
              rows={3}
              placeholder="Tell the team what to change…"
              value={comment}
              maxLength={2000}
              aria-invalid={error === CHANGES_COMMENT_REQUIRED || undefined}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError(null);
              }}
            />
            {error && <div className="text-xs text-red-ink">{error}</div>}
            <div className="flex flex-col gap-[10px]">
              <button
                type="button"
                disabled={pending}
                onClick={() => decide("APPROVED")}
                className="flex items-center justify-center gap-2 rounded-control bg-violet px-4 py-[11px] text-sm font-medium text-white shadow-violet disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckIcon size={16} />
                Approve
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => decide("CHANGES_REQUESTED")}
                className="rounded-control border border-line-strong bg-card px-4 py-[11px] text-sm font-medium text-ink shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                Request changes
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
