import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons";

/** A small capitalised label ("CLIENTS & PROJECTS") with its list of links. */
export function SideSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 px-2 pb-2 text-[11px] font-medium tracking-[0.05em] text-muted">
        <ChevronDownIcon />
        {label}
      </div>
      {children}
    </div>
  );
}
