import type { ReactNode } from "react";

/** A grey Team settings panel: 16 px heading, something on the right, then its white card. */
export function SettingsSection({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px]">
      <div className="flex items-center justify-between gap-3 px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
