import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/** A grey Billing section: 16 px title over its white card(s). */
export function BillingSection({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={cx("flex min-w-0 flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px]", className)}>
      <div className="px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}
