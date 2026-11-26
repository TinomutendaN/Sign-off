"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { postComment } from "../actions";
import type { Person, TaskComment } from "../board";

type TaskCommentsProps = { taskId: string; comments: TaskComment[]; me: Person };

/**
 * Team-only comments, oldest first, and the comment box. Enter posts, Shift+Enter adds a line.
 * A posted comment shows straight away under the signed-in person's name.
 */
export function TaskComments({ taskId, comments, me }: TaskCommentsProps) {
  const [list, addPending] = useOptimistic(comments, (current, added: TaskComment) => [...current, added]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fieldId = useId();

  function post() {
    const text = draft.trim();
    if (!text || pending) return;
    setError(null);
    setDraft("");
    startTransition(async () => {
      addPending({ id: `pending-${Date.now()}`, author: me, when: "Just now", text });
      const result = await postComment({ taskId, text });
      if (!result.ok) {
        setError(result.error);
        setDraft(text);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-sm font-semibold">Comments</h3>
        <span className="text-xs text-muted">
          {list.length} {list.length === 1 ? "comment" : "comments"} · team only
        </span>
      </div>

      {list.map((c) => (
        <div key={c.id} className="flex gap-[10px]">
          <Avatar label={c.author.initials} tone={c.author.tone} size={28} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="text-xs">
              <span className="font-semibold">{c.author.name}</span>
              <span className="text-muted"> · {c.when}</span>
            </div>
            <div className="rounded-[0_10px_10px_10px] bg-soft px-3 py-[9px] text-[13px] leading-normal break-words whitespace-pre-line text-ink-2">
              {c.text}
            </div>
          </div>
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          post();
        }}
        className="flex flex-col gap-2 rounded-card border border-line-strong p-[10px] focus-within:border-violet"
      >
        <label htmlFor={fieldId} className="text-xs font-medium text-ink-2">
          Write a comment
        </label>
        <textarea
          id={fieldId}
          rows={2}
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              post();
            }
          }}
          placeholder="Share an update with the team…"
          className="-mt-0.5 block w-full resize-none border-0 bg-transparent font-sans text-[13px] text-ink outline-none placeholder:text-muted"
        />
        {error && (
          <p role="alert" className="m-0 text-xs text-red-ink">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted">Clients can&apos;t see team comments</span>
          <button
            type="submit"
            disabled={!draft.trim() || pending}
            className="rounded-switch bg-violet px-[14px] py-2 text-[13px] font-medium text-white shadow-violet disabled:cursor-not-allowed disabled:opacity-60"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
