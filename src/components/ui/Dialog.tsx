"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible title; also drawn as the 20 px heading. */
  title: string;
  /** Icon tile left of the title (44 px, violet tint). */
  icon?: ReactNode;
  /** Grey paragraph under the title. */
  description?: ReactNode;
  children?: ReactNode;
};

/**
 * Centred dialog: navy overlay at 36%, grey outer frame (24 px corners, 8 px padding),
 * white inside (18 px corners, 26 px padding). Closes on Esc, the × tile, or a click outside.
 */
export function Dialog({ open, onClose, title, icon, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[min(560px,calc(100%-40px))] max-w-none rounded-dialog bg-panel p-2 text-ink shadow-dialog backdrop:bg-ink/36"
    >
      <div className="flex flex-col gap-[18px] rounded-column bg-card p-[26px]">
        <div className="flex items-start gap-[14px]">
          {icon && (
            <span className="flex h-11 flex-[0_0_44px] items-center justify-center rounded-card bg-violet-tint text-violet-icon">
              {icon}
            </span>
          )}
          <div className="flex flex-1 flex-col gap-1.5">
            <h2 id="dialog-title" className="m-0 text-xl font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            {description && <p className="m-0 text-sm leading-[1.55] text-muted">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 flex-[0_0_32px] items-center justify-center rounded-switch bg-soft text-muted"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
