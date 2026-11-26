import { DownloadIcon, FileIcon } from "@/components/icons";
import { Pill, type PillTone } from "@/components/ui/Pill";

const BADGE = {
  APPROVED: { label: "Approved", tone: "green" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "red" },
  WAITING: { label: "Waiting on you", tone: "amber" },
} as const satisfies Record<string, { label: string; tone: PillTone }>;

type EarlierDeliverableRowProps = {
  title: string;
  /** 'You asked for changes on 21 Nov: "…"' or "palette.pdf · Approved by you on 18 Nov" */
  meta: string;
  status: keyof typeof BADGE;
  fileName: string;
  downloadHref: string;
};

/** Client project view: a deliverable the client already decided on, with its pill and download button. */
export function EarlierDeliverableRow({ title, meta, status, fileName, downloadHref }: EarlierDeliverableRowProps) {
  const badge = BADGE[status];
  return (
    <article className="flex flex-wrap items-center gap-[14px] rounded-card bg-card p-[14px] shadow-card">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-soft text-muted">
        <FileIcon size={18} />
      </span>
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
        <div className="text-sm font-medium text-ink">{title}</div>
        <div className="text-xs text-muted">{meta}</div>
      </div>
      <Pill tone={badge.tone} size="md">
        {badge.label}
      </Pill>
      <a
        href={downloadHref}
        download={fileName}
        aria-label={`Download ${title}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-control border border-panel text-muted hover:text-ink"
      >
        <DownloadIcon />
      </a>
    </article>
  );
}
