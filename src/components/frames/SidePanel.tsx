import type { ReactNode } from "react";

/** The white side panel inside the grey frame (220 px). Hidden at tablet width and below. */
export function SidePanel({ children }: { children: ReactNode }) {
  return (
    <aside className="flex min-h-0 flex-[0_0_220px] tablet:hidden">
      <div className="scroll-y flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto rounded-side bg-card px-2 py-3 shadow-side">{children}</div>
    </aside>
  );
}
