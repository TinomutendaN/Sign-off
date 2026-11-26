"use client";

import { useState, useTransition } from "react";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import type { TaskStatus } from "@/generated/prisma/enums";
import { createTask } from "../actions";
import { STATUS_LABEL } from "../labels";

type AddTaskInlineProps = {
  projectId: string;
  status: TaskStatus;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

/** "+ Add task" at the bottom of a column; opens a title field (Enter adds, Esc cancels). */
export function AddTaskInline({ projectId, status, open, onOpen, onClose }: AddTaskInlineProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center justify-center gap-2 rounded-control bg-transparent p-3 text-sm text-ink-3"
      >
        <PlusIcon size={14} />
        Add task
      </button>
    );
  }

  const close = () => {
    setTitle("");
    setError(null);
    onClose();
  };

  const submit = () => {
    if (!title.trim() || pending) return;
    startTransition(async () => {
      const result = await createTask({ projectId, status, title });
      if (result.ok) close();
      else setError(result.error);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-[10px] rounded-card bg-card p-[14px] shadow-card"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
        maxLength={200}
        placeholder="Task title"
        aria-label={`New task in ${STATUS_LABEL[status]}`}
        className="rounded-control border border-line-strong bg-card px-3 py-[10px] text-sm text-ink outline-none placeholder:text-muted focus:border-violet"
      />
      {error && <p className="m-0 text-xs text-red-ink">{error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || !title.trim()}>
          {pending ? "Adding…" : "Add task"}
        </Button>
        <button type="button" onClick={close} className="bg-transparent px-2 py-[9px] text-[13px] text-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
