import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CompanySquare } from "@/components/ui/CompanySquare";
import { cx } from "@/components/ui/cx";
import type { listClientAccess } from "@/features/clients/queries";
import { RolePill } from "./RolePill";
import { SettingsSection } from "./SettingsSection";

type Rows = Awaited<ReturnType<typeof listClientAccess>>;

/** Who on each client's side can see which projects, with a link to the Clients screen. */
export function ClientAccessPanel({ clients }: { clients: Rows }) {
  return (
    <SettingsSection
      title="Client access"
      aside={
        <Link href="/clients" className="text-[13px] font-medium">
          Manage clients
        </Link>
      }
    >
      <Card className="flex flex-col px-4 py-1">
        {clients.map((c, i) => (
          <div
            key={c.id}
            className={cx(
              "flex flex-wrap items-center gap-[14px] py-[14px]",
              i < clients.length - 1 && "border-b border-soft-2",
            )}
          >
            <CompanySquare label={c.initials} tone={c.tone} size={34} />
            <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
              <span className="text-sm font-medium text-ink">{c.title}</span>
              <span className="text-xs text-muted">{c.sees}</span>
            </span>
            <RolePill role={c.joined ? "Client" : "Invite sent"} />
          </div>
        ))}
        {clients.length === 0 && <p className="m-0 py-[14px] text-[13px] text-muted">No clients yet.</p>}
      </Card>
    </SettingsSection>
  );
}
