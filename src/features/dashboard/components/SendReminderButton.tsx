"use client";

import { useState, useTransition } from "react";
import { cx } from "@/components/ui/cx";
import { sendReminder } from "../actions";

type SendReminderButtonProps = {
  deliverableId: string;
  /** A reminder was already sent in the last 24 hours. */
  reminded: boolean;
};

/** "Send reminder" → "Reminder sent" (green). Records a reminder line the client also sees. */
export function SendReminderButton({ deliverableId, reminded }: SendReminderButtonProps) {
  const [sent, setSent] = useState(reminded);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = sent || reminded;

  function remind() {
    setError(null);
    setSent(true);
    startTransition(async () => {
      const result = await sendReminder({ deliverableId });
      if (!result.ok) {
        setSent(false);
        setError(result.error);
      }
    });
  }

  return (
    <span className="flex flex-col items-end gap-1 phone:items-start">
      <button
        type="button"
        onClick={remind}
        disabled={done || pending}
        className={cx(
          "rounded-control border border-panel px-3 py-2 text-[13px] font-medium disabled:cursor-default",
          done ? "bg-green-tint text-green-ink" : "bg-card text-ink",
        )}
      >
        {done ? "Reminder sent" : "Send reminder"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-ink">
          {error}
        </span>
      )}
    </span>
  );
}
