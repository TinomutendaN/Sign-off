import Link from "next/link";
import { ClockIcon, PencilIcon } from "@/components/icons";
import { cx } from "@/components/ui/cx";
import { SendReminderButton } from "./SendReminderButton";

type WaitingRowProps =
  | { kind: "waiting"; deliverableId: string; title: string; meta: string; reminded: boolean }
  | { kind: "changes"; title: string; meta: string; uploadHref: string };

/**
 * One row under "Waiting on clients": an amber clock for an approval the client hasn't given yet
 * (with "Send reminder"), or a red pencil for changes they asked for (with "Upload new version").
 */
export function WaitingRow(props: WaitingRowProps) {
  const waiting = props.kind === "waiting";
  return (
    <article className="flex flex-wrap items-center gap-[14px] rounded-card bg-card p-[14px] shadow-card">
      <span
        className={cx(
          "flex size-10 shrink-0 items-center justify-center rounded-control",
          waiting ? "bg-amber-tint text-amber-ink" : "bg-red-tint text-red-ink",
        )}
      >
        {waiting ? <ClockIcon /> : <PencilIcon strokeWidth={1.8} />}
      </span>
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
        <span className="text-sm font-medium text-ink">{props.title}</span>
        <span className="text-xs text-muted">{props.meta}</span>
      </div>
      {props.kind === "waiting" ? (
        <SendReminderButton deliverableId={props.deliverableId} reminded={props.reminded} />
      ) : (
        <Link
          href={props.uploadHref}
          className="rounded-control border border-panel bg-card px-3 py-2 text-[13px] font-medium text-ink hover:text-ink"
        >
          Upload new version
        </Link>
      )}
    </article>
  );
}
