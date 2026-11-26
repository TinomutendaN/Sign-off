"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type TaskDetailMenuProps = {
  /** What the menu changes, for screen readers: "Assignee". */
  label: string;
  /** The value exactly as the design draws it (avatar and name, date, pill). */
  value: ReactNode;
  disabled?: boolean;
  children: (close: () => void) => ReactNode;
};

/**
 * A detail value in the task panel that opens a small menu (our card style, like the account
 * menu) when clicked. The value keeps the design's look: no border or arrow, only a soft
 * wash on hover and a focus ring. Esc closes the menu (not the panel); ↑/↓ move between items.
 */
export function TaskDetailMenu({ label, value, disabled, children }: TaskDetailMenuProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const triggerId = useId();
  const menu = useRef<HTMLDivElement>(null);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) document.getElementById(triggerId)?.focus();
  };

  useEffect(() => {
    if (!open) return;
    // Start on the chosen item, or the first control.
    const items = menu.current?.querySelectorAll<HTMLElement>("[role^=menuitem], input");
    const checked = menu.current?.querySelector<HTMLElement>("[aria-checked=true]");
    (checked ?? items?.[0])?.focus();

    const onPointer = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      // Keep the panel open: only the menu closes.
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const items = [...(menu.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])];
      if (!items.length) return;
      e.preventDefault();
      const at = items.indexOf(document.activeElement as HTMLElement);
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(at + step + items.length) % items.length].focus();
    }
  };

  return (
    <div ref={wrap} className="relative flex min-w-0" onKeyDown={onKeyDown}>
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-mx-1.5 -my-1 flex min-w-0 items-center gap-2 rounded-switch bg-transparent px-1.5 py-1 text-left text-[13px] text-ink outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-violet aria-expanded:bg-soft disabled:cursor-default"
      >
        <span className="sr-only">Change {label.toLowerCase()}: </span>
        {value}
      </button>
      {open && (
        <div
          ref={menu}
          role="menu"
          aria-label={label}
          className="absolute top-full left-0 z-10 mt-1.5 -ml-1.5 flex w-[220px] flex-col gap-0.5 rounded-card border border-line bg-card p-1.5 shadow-raised"
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
