import { CompanySquare } from "@/components/ui/CompanySquare";
import { cx } from "@/components/ui/cx";
import type { SubscriberRow } from "../queries";

type SubscriberTableProps = {
  rows: SubscriberRow[];
  /** The Subscribers screen adds a Members column (and is wider). */
  showMembers?: boolean;
  empty?: string;
};

const th = "px-2 py-3 font-medium";
const td = "px-2 py-3";

/** The subscribers table on the Admin dashboard ("Newest subscribers") and the Subscribers screen. */
export function SubscriberTable({ rows, showMembers = false, empty = "No subscribers yet." }: SubscriberTableProps) {
  return (
    <div className="overflow-x-auto rounded-card bg-card px-4 py-1 shadow-card">
      <table className={cx("w-full border-collapse text-[13px]", showMembers ? "min-w-[900px]" : "min-w-[760px]")}>
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className={th}>Workspace</th>
            <th className={th}>Owner</th>
            <th className={th}>Plan</th>
            <th className={th}>Billing</th>
            {showMembers && <th className={th}>Members</th>}
            <th className={th}>Status</th>
            <th className={th}>Started</th>
            <th className={cx(th, "text-right")}>Monthly value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className={cx("border-t border-soft-2", s.highlight && "bg-violet-soft")}>
              <td className={td}>
                <span className="flex items-center gap-[10px]">
                  <CompanySquare label={s.initials} tone={s.tone} size={28} />
                  <span className="font-medium text-ink">{s.workspace}</span>
                </span>
              </td>
              <td className={cx(td, "text-ink-2")}>{s.owner}</td>
              <td className={cx(td, "text-ink")}>{s.plan}</td>
              <td className={cx(td, "whitespace-nowrap text-ink-2")}>{s.billing}</td>
              {showMembers && <td className={cx(td, "text-ink-2")}>{s.members}</td>}
              <td className={td}>
                <span
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-xs font-semibold",
                    s.active ? "bg-green-tint text-green-ink" : "bg-red-tint text-red-ink",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {s.active ? "Active" : "Cancelled"}
                </span>
              </td>
              <td className={cx(td, "whitespace-nowrap text-ink-2")}>{s.started}</td>
              <td className={cx(td, "text-right font-semibold text-ink")}>{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="p-6 text-center text-[13px] text-muted">{empty}</div>}
    </div>
  );
}
