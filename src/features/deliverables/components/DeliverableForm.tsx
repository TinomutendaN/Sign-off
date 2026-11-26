"use client";

import { upload } from "@vercel/blob/client";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { CheckIcon, FileIcon, SendIcon, UploadIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import { Field } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fileSize } from "@/lib/format";
import { sendDeliverable } from "../actions";
import { ACCEPT, ALLOWED_TYPES, limitLabel, titleFromFileName } from "../files";

export type FormOptions = {
  projectId: string;
  clientName: string;
  /** This project's milestones that aren't approved yet. */
  milestones: { id: string; label: string }[];
  defaultMilestoneId: string | null;
  /** orgs/{orgId}/projects/{projectId}/ */
  uploadFolder: string;
  limitBytes: number;
};

type Replacing = { id: string; title: string; milestoneId: string } | null;

type FileState =
  | { status: "uploading"; name: string; size: number; pct: number }
  | { status: "uploaded"; name: string; size: number; url: string; pathname: string };

const control =
  "rounded-control border border-line-strong bg-card px-3 py-[10px] text-[13px] font-normal text-ink outline-none focus:border-violet";

/** Upload a file, give it a title, milestone and note, then send it to the client for approval. */
export function DeliverableForm({
  projectId,
  clientName,
  milestones,
  defaultMilestoneId,
  uploadFolder,
  limitBytes,
  replacing,
}: FormOptions & { replacing: Replacing }) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const openIds = milestones.map((m) => m.id);
  const startMilestone =
    replacing && openIds.includes(replacing.milestoneId) ? replacing.milestoneId : (defaultMilestoneId ?? openIds[0] ?? "");

  const [file, setFile] = useState<FileState | null>(null);
  const [title, setTitle] = useState(replacing?.title ?? "");
  const [titleTouched, setTitleTouched] = useState(Boolean(replacing));
  const [milestoneId, setMilestoneId] = useState(startMilestone);
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTitle, setSentTitle] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clearReplace() {
    router.replace(pathname, { scroll: false });
  }

  async function start(chosen: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(chosen.type)) {
      setError("That file type isn't supported. Upload a PDF, an image (PNG, JPG, WEBP or GIF) or a zip.");
      return;
    }
    if (chosen.size > limitBytes) {
      setError(`That file is ${fileSize(chosen.size)}. The limit is ${limitLabel(limitBytes)}.`);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setFile({ status: "uploading", name: chosen.name, size: chosen.size, pct: 0 });
    if (!titleTouched) setTitle(titleFromFileName(chosen.name));

    try {
      const blob = await upload(uploadFolder + chosen.name, chosen, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        clientPayload: JSON.stringify({ projectId }),
        contentType: chosen.type,
        abortSignal: controller.signal,
        onUploadProgress: ({ percentage }) => {
          if (controller.signal.aborted) return;
          setFile({ status: "uploading", name: chosen.name, size: chosen.size, pct: percentage });
        },
      });
      if (controller.signal.aborted) return;
      setFile({ status: "uploaded", name: chosen.name, size: chosen.size, url: blob.url, pathname: blob.pathname });
    } catch (e) {
      if (controller.signal.aborted) return;
      setFile(null);
      const message = e instanceof Error ? e.message : "";
      setError(
        /not allowed|access|forbidden|workspace/i.test(message)
          ? "You can't upload files to this project."
          : "The upload didn't finish. Check your connection and try again.",
      );
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) void start(dropped);
  }

  function send() {
    if (file?.status !== "uploaded") return;
    setError(null);
    startTransition(async () => {
      const result = await sendDeliverable({
        projectId,
        milestoneId,
        title,
        note: note.trim() || undefined,
        file: { url: file.url, pathname: file.pathname, name: file.name },
        replacesId: replacing?.id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSentTitle(title.trim());
      router.refresh();
    });
  }

  function addAnother() {
    setFile(null);
    setTitle("");
    setTitleTouched(false);
    setNote("");
    setMilestoneId(defaultMilestoneId ?? openIds[0] ?? "");
    setSentTitle(null);
    setError(null);
    if (replacing) clearReplace();
  }

  if (sentTitle) {
    return (
      <Card className="p-4">
        <div className="flex flex-col items-center gap-[10px] px-3 py-6 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-green-tint text-green-ink">
            <CheckIcon size={22} />
          </span>
          <div className="text-[15px] font-semibold text-ink">Sent for approval</div>
          <div className="text-[13px] leading-normal text-muted">
            {sentTitle} is now waiting on {clientName}.
          </div>
          <button
            type="button"
            onClick={addAnother}
            className="mt-1 rounded-control border border-panel bg-card px-[14px] py-[9px] text-[13px] font-medium text-ink"
          >
            Add another
          </button>
        </div>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className="p-4 text-[13px] leading-normal text-muted">
        Every milestone on this project is approved, so there&apos;s nothing left to send.
      </Card>
    );
  }

  const canSend = file?.status === "uploaded" && title.trim().length > 0 && Boolean(milestoneId) && !pending;

  return (
    <Card className="flex flex-col gap-[14px] p-4">
      {replacing && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control bg-violet-tint px-3 py-2 text-xs text-violet-ink">
          <span>
            New version of <span className="font-semibold">{replacing.title}</span>
          </span>
          <button type="button" onClick={clearReplace} className="ml-auto font-medium text-violet-icon underline-offset-2 hover:underline">
            Cancel
          </button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          "flex flex-col items-center gap-1.5 rounded-card border-[1.5px] border-dashed bg-soft-4 p-[18px] text-center",
          dragging ? "border-violet" : "border-line-dash",
        )}
      >
        <UploadIcon className="text-violet" />
        <div className="text-[13px] font-medium text-ink">
          Drop a file or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-violet-icon hover:text-violet-ink"
          >
            browse
          </button>
        </div>
        <div className="text-[11px] text-muted">PDF, images or zip, up to {limitLabel(limitBytes)}</div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            e.target.value = "";
            if (chosen) void start(chosen);
          }}
        />
      </div>

      {file && (
        <div className="flex items-center gap-3 rounded-control bg-soft px-3 py-[10px]">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-card text-muted">
            <FileIcon size={16} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[13px] font-medium text-ink">{file.name}</span>
            <span className="text-[11px] text-muted">
              {fileSize(file.size)} · {file.status === "uploaded" ? "Uploaded" : `Uploading ${Math.round(file.pct)}%`}
            </span>
            {file.status === "uploading" && (
              <ProgressBar value={file.pct} track="white" height={5} className="mt-1" label="Upload progress" />
            )}
          </div>
          {file.status === "uploaded" && <CheckIcon className="shrink-0 text-green-ink" />}
        </div>
      )}

      <Field
        label="Title"
        value={title}
        maxLength={200}
        onChange={(e) => {
          setTitle(e.target.value);
          setTitleTouched(true);
        }}
      />

      <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-2">
        Milestone
        <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} className={control}>
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <Field label="Note for the client" multiline rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />

      {error && (
        <p role="alert" className="m-0 text-xs text-red-ink">
          {error}
        </p>
      )}

      <Button size="md" className="w-full py-[11px]" icon={<SendIcon />} onClick={send} disabled={!canSend}>
        {pending ? "Sending…" : "Send to client for approval"}
      </Button>
      <div className="text-[11px] leading-normal text-muted">{clientName} sees it in their portal.</div>
    </Card>
  );
}
