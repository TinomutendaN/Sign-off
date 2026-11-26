import type { ReactNode } from "react";
import { CheckIcon } from "@/components/icons";

type TaskMenuItemProps = { checked: boolean; onSelect: () => void; children: ReactNode };

/** One choice in a task panel menu, with a violet tick on the current value. */
export function TaskMenuItem({ checked, onSelect, children }: TaskMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left text-[13px] text-ink outline-none hover:bg-soft focus-visible:bg-soft"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      {checked && <CheckIcon size={14} className="shrink-0 text-violet-icon" />}
    </button>
  );
}
