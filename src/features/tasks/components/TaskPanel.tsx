"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useOptimistic, useRef, useState, useTransition } from "react";
import { CloseIcon, FileIcon, LinkIcon } from "@/components/icons";
import { cx } from "@/components/ui/cx";
import type { TaskStatus } from "@/generated/prisma/enums";
import { setTaskStatus } from "../actions";
import type { TaskDetail, TaskOptions } from "../board";
import { STATUS_LABEL, TYPE_TAG } from "../labels";
import { TaskComments } from "./TaskComments";
import { TaskDetails } from "./TaskDetails";

type TaskPanelProps = { task: TaskDetail; options: TaskOptions };

const tile =
  "flex size-[34px] shrink-0 items-center justify-center rounded-switch bg-soft text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-violet";

/**
 * 08 Task detail: the panel on the right over a navy overlay (a modal <dialog>, so focus moves
 * in and stays in, and the page behind can't be used). Close (×), Esc or a click on the overlay
 * removes ?task from the address and returns focus to the card. Phones: the panel fills the screen.
 */
export function TaskPanel({ task, options }: TaskPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const closing = useRef(false);
  const titleId = useId();

  const [status, setStatus] = useOptimistic(task.status);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"copied" | "failed" | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!opener.current) opener.current = document.activeElement;
    if (!dialog.open) dialog.showModal();
    // Hold the page still behind the panel (its scroll position is kept).
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  function close() {
    if (closing.current) return;
    closing.current = true;
    const dialog = ref.current;
    if (dialog?.open) dialog.close();
    document.documentElement.style.overflow = "";

    // Back to the card or row that opened the panel (it may have re-rendered since).
    const first = opener.current;
    const back =
      first instanceof HTMLElement && first.isConnected && first !== document.body
        ? first
        : document.querySelector<HTMLElement>(`a[href$="task=${task.id}"]`);
    back?.focus({ preventScroll: true });

    const params = new URLSearchParams(window.location.search);
    params.delete("task");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function pickStatus(next: TaskStatus) {
    if (next === status) return;
    setError(null);
    startTransition(async () => {
      setStatus(next);
      const result = await setTaskStatus({ taskId: task.id, status: next });
      if (!result.ok) setError(result.error);
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${pathname}?task=${task.id}`);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClose={close}
      onClick={(e) => {
        // Only the overlay: a click on the panel's grey rim also targets the dialog itself.
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
      }}
      className="fixed inset-y-[10px] right-[10px] left-auto m-0 h-auto max-h-none w-[min(480px,calc(100%-20px))] max-w-none rounded-panel border-0 bg-panel p-2 text-ink shadow-drawer backdrop:bg-ink/32 open:flex phone:inset-0 phone:w-full phone:rounded-none phone:p-0"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[18px] overflow-y-auto rounded-side bg-card px-5 py-[18px] outline-none phone:rounded-none phone:px-4">
        <div className="flex items-center gap-[10px]">
          <span className="min-w-0 flex-1 truncate text-xs text-muted">
            {task.projectName} / {STATUS_LABEL[status]}
          </span>
          <span role="status" className={cx("text-xs font-medium", copied === "failed" ? "text-red-ink" : "text-green-ink")}>
            {copied === "copied" ? "Copied" : copied === "failed" ? "Couldn't copy" : ""}
          </span>
          <button type="button" aria-label="Copy link to task" onClick={copyLink} className={tile}>
            <LinkIcon />
          </button>
          <button type="button" aria-label="Close" onClick={close} className={tile}>
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className={cx("h-1 w-[30px] rounded-[2px]", TYPE_TAG[task.type])} />
          <h2 id={titleId} className="m-0 text-[22px] font-semibold tracking-[-0.01em]">
            {task.title}
          </h2>
        </div>

        <TaskDetails task={task} options={options} status={status} onStatus={pickStatus} />
        {error && (
          <p role="alert" className="-mt-2 mb-0 text-xs text-red-ink">
            {error}
          </p>
        )}

        <div className="h-px shrink-0 bg-soft-2" />

        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-sm font-semibold">Description</h3>
          {task.description ? (
            <p className="m-0 text-sm leading-[1.6] whitespace-pre-line text-ink-2">{task.description}</p>
          ) : (
            <p className="m-0 text-sm text-muted">No description yet.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-sm font-semibold">Files</h3>
          {task.files.length === 0 && <p className="m-0 text-sm text-muted">No files on this task.</p>}
          {task.files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-control bg-soft px-3 py-[10px]">
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-card text-muted">
                <FileIcon size={16} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[13px] font-medium">{f.name}</span>
                <span className="text-[11px] text-muted">
                  From {f.from} · {f.size}
                </span>
              </span>
              <a href={f.url} download={f.name} className="text-xs font-medium">
                Download
              </a>
            </div>
          ))}
        </div>

        <div className="h-px shrink-0 bg-soft-2" />

        <TaskComments taskId={task.id} comments={task.comments} me={options.me} />
      </div>
    </dialog>
  );
}
