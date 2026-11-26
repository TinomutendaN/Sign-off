import Link from "next/link";
import { FileIcon } from "@/components/icons";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { BADGE } from "@/features/tasks/labels";
import type { Member } from "@/features/workspaces/queries";
import { displayName, shortDate } from "@/lib/format";
import { downloadHref } from "../files";
import type { MilestoneWithDeliverables } from "../queries";

type Deliverable = MilestoneWithDeliverables["deliverables"][number];

const JUST_NOW_MS = 5 * 60 * 1000;

/** "Sent 22 Nov by Leo R.", "Sent just now by Tino M." or, once approved, "Approved 18 Nov". */
function whenLine(d: Deliverable, members: Member[], now: Date): string {
  const decision = d.decisions[0];
  if (d.status === "APPROVED" && decision?.kind === "APPROVED") return `Approved ${shortDate(decision.createdAt)}`;
  const sender = members.find((m) => m.id === d.sentById);
  const by = sender ? ` by ${displayName(sender)}` : "";
  const when = now.getTime() - d.sentAt.getTime() < JUST_NOW_MS ? "just now" : shortDate(d.sentAt);
  return `Sent ${when}${by}`;
}

/** One deliverable in a milestone: file, status pill and, for Changes requested, the client's note. */
export function DeliverableRow({
  deliverable: d,
  clientName,
  members,
  now,
}: {
  deliverable: Deliverable;
  clientName: string;
  members: Member[];
  now: Date;
}) {
  const badge = BADGE[d.status];
  const decision = d.decisions[0];
  const changes = d.status === "CHANGES_REQUESTED";
  const note = changes && decision?.kind === "CHANGES_REQUESTED" ? decision.comment : null;

  return (
    <Card className="flex flex-col gap-[10px] p-[14px]">
      <div className="flex flex-wrap items-center gap-[14px]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-soft text-muted">
          <FileIcon size={18} />
        </span>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
          <div className="text-sm font-medium text-ink">{d.title}</div>
          <div className="text-xs text-muted">
            <a
              href={downloadHref(d.fileUrl)}
              download={d.fileName}
              title={`Download ${d.fileName}`}
              className="text-muted underline-offset-2 hover:text-violet-ink hover:underline"
            >
              {d.fileName}
            </a>
            {" · "}
            {whenLine(d, members, now)}
          </div>
        </div>
        <Pill tone={badge.tone} size="md">
          {badge.label}
        </Pill>
        {changes && (
          <Link
            href={`?replace=${d.id}#add-deliverable`}
            scroll={false}
            className="rounded-control border border-panel px-3 py-2 text-[13px] font-medium text-ink hover:text-ink"
          >
            Upload new version
          </Link>
        )}
      </div>
      {note && (
        <div className="ml-[54px] rounded-control bg-red-soft px-3 py-[10px] text-[13px] leading-normal text-ink-2 phone:ml-0">
          <span className="font-semibold">{clientName}:</span> {note}
        </div>
      )}
    </Card>
  );
}
