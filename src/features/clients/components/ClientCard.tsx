"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLinkIcon } from "@/components/icons";
import { Card } from "@/components/ui/Card";
import { CompanySquare } from "@/components/ui/CompanySquare";
import { Pill } from "@/components/ui/Pill";
import { cx } from "@/components/ui/cx";
import type { ClientSummary } from "../queries";

const dots: Record<string, string> = {
  violet: "bg-violet",
  amber: "bg-amber",
  green: "bg-green",
  blue: "bg-blue",
  red: "bg-red",
};

const outline =
  "inline-flex items-center gap-2 rounded-control border border-panel bg-card px-3 py-2 text-[13px] font-medium text-ink disabled:opacity-60";

type ClientCardProps = {
  client: ClientSummary;
  /** "Resend invite". Resolves once the new invite is shown in the invite panel. */
  onResend: (clientId: string) => Promise<void>;
};

/** One client: company, status, contact, portal or resend button, three stat tiles, project chips. */
export function ClientCard({ client, onResend }: ClientCardProps) {
  const [busy, setBusy] = useState(false);
  const waiting = client.waiting === 0 ? "None" : `${client.waiting} ${client.waiting === 1 ? "approval" : "approvals"}`;
  const stats = [
    { label: "Projects", value: String(client.projects.length) },
    { label: "Waiting on client", value: waiting },
    { label: "Last activity", value: client.lastActivity },
  ];

  async function resend() {
    setBusy(true);
    await onResend(client.id);
    setBusy(false);
  }

  return (
    <Card className="flex flex-col gap-[14px] p-4">
      <div className="flex flex-wrap items-center gap-[14px]">
        <CompanySquare label={client.initials} tone={client.tone} />
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
          <div className="flex items-center gap-[10px]">
            <span className="text-base font-semibold text-ink">{client.name}</span>
            {client.active ? <Pill tone="green">Active</Pill> : <Pill tone="amber">Invite sent</Pill>}
          </div>
          <div className="truncate text-xs text-muted">{client.contact}</div>
        </div>
        {client.active ? (
          // No agency-side design for the client's portal yet, so it's shown but inactive.
          <button type="button" disabled title="Coming soon" className={outline}>
            <ExternalLinkIcon size={15} />
            See their portal
          </button>
        ) : (
          <button type="button" onClick={resend} disabled={busy} className={outline}>
            {busy ? "Sending…" : "Resend invite"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[10px]">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-[3px] rounded-control bg-soft px-3 py-[10px]">
            <span className="text-[11px] text-muted">{s.label}</span>
            <span className="text-sm font-semibold text-ink">{s.value}</span>
          </div>
        ))}
      </div>
      {client.projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Projects</span>
          {client.projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex items-center gap-1.5 rounded-full bg-soft-2 px-[10px] py-[5px] text-xs font-medium text-ink hover:text-ink"
            >
              <span className={cx("size-[7px] rounded-[2px]", dots[p.colour] ?? dots.violet)} />
              {p.name}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
