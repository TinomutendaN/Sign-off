"use client";

import { useState } from "react";
import { PeopleIcon, SearchIcon } from "@/components/icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import type { PaidPlanKey } from "@/features/billing/plans";
import { resendClientInvite, type InviteSent } from "../actions";
import type { ClientSummary } from "../queries";
import { ClientCard } from "./ClientCard";
import { InviteClientPanel } from "./InviteClientPanel";

/** 05 Clients: header with search, "All clients" cards and the "Invite a client" panel. */
export function ClientsScreen({
  clients,
  workspaceName,
  planIds,
}: {
  clients: ClientSummary[];
  workspaceName: string;
  /** Clerk plan IDs, for the upgrade pop-up's checkout buttons. */
  planIds: Record<PaidPlanKey, string | null>;
}) {
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState<InviteSent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const shown = clients.filter((c) => !q || c.search.includes(q));
  const n = clients.length;

  async function resend(clientId: string) {
    setError(null);
    const result = await resendClientInvite({ clientId });
    if (result.ok) setSent(result);
    else setError(result.error);
  }

  return (
    <>
      <ScreenHeader
        icon={<PeopleIcon size={22} />}
        title="Clients"
        subtitle={`${n} ${n === 1 ? "client" : "clients"} · ${workspaceName}`}
      >
        <label className="flex w-[220px] items-center gap-2 rounded-control border border-panel px-3 py-[9px] text-[13px] text-muted shadow-xs phone:w-full">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            aria-label="Search clients"
            className="w-full border-0 bg-transparent text-ink outline-none placeholder:text-muted"
          />
        </label>
      </ScreenHeader>

      <div className="flex flex-wrap items-start gap-[14px]">
        <section className="flex min-w-0 flex-[999_1_520px] flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px]">
          <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
            <h2 className="m-0 text-base font-medium text-ink">All clients</h2>
            <span className="text-xs text-muted">{n}</span>
          </div>
          {error && (
            <p role="alert" className="m-0 px-2 text-[13px] text-red-ink">
              {error}
            </p>
          )}
          {shown.map((c) => (
            <ClientCard key={c.id} client={c} onResend={resend} />
          ))}
          {shown.length === 0 && (
            <p className="m-0 px-2 pb-2 text-[13px] text-muted">
              {n === 0 ? "No clients yet. Invite your first client." : "No clients match your search."}
            </p>
          )}
        </section>
        <InviteClientPanel sent={sent} onSent={setSent} planIds={planIds} />
      </div>
    </>
  );
}
