import type { ReactNode } from "react";
import { cx } from "./cx";

type SectionProps = {
  title: ReactNode;
  /** Right of the title: a count or a small grey label. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A grey #E8E7F0 section panel with its 16 px title row (Client home, client project view, Dashboard). */
export function Section({ title, aside, className, children }: SectionProps) {
  return (
    <section className={cx("flex min-w-0 flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px]", className)}>
      <div className="flex items-center justify-between gap-3 px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
