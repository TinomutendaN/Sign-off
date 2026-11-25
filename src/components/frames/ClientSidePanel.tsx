import { auth } from "@clerk/nextjs/server";
import { Avatar } from "@/components/ui/Avatar";
import { getPortalSidebar } from "@/features/clients/queries";
import { nameInitials } from "@/lib/format";
import { SideCard } from "./SideCard";
import { SideIdentity } from "./SideIdentity";
import { SideLink } from "./SideLink";
import { SideSection } from "./SideSection";

/** Client portal side panel data: the client's company, their projects and their agency contact. */
export async function ClientSidePanel() {
  const { userId } = await auth();
  const data = userId ? await getPortalSidebar(userId) : null;

  // Step 3 blocks people without client access; until then show a neutral state.
  if (!data) {
    return <div className="flex-1 px-2 text-xs text-muted">No shared projects yet.</div>;
  }

  return (
    <>
      <div className="flex items-center gap-[10px] p-2">
        <SideIdentity
          initials={nameInitials(data.clientName)}
          square="client"
          title={data.clientName}
          subtitle="Client portal"
        />
      </div>
      <SideSection label="YOUR PROJECTS">
        {data.projects.map((p) => (
          <SideLink
            key={p.id}
            href={`/portal/projects/${p.id}`}
            match={`/portal/projects/${p.id}`}
            dot={p.colour}
            title={p.name}
            badge={p.waitingCount}
          />
        ))}
      </SideSection>
      <div className="flex-1" />
      <SideCard>
        <div className="text-[11px] font-medium tracking-[0.05em] text-muted">YOUR AGENCY</div>
        {data.contact ? (
          <div className="flex items-center gap-[10px]">
            <Avatar person={data.contact} tone={data.contact.tone} size={32} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-ink">{data.contact.name}</span>
              <span className="text-[11px] text-muted">
                {data.contact.note} · {data.agencyName}
              </span>
            </span>
          </div>
        ) : (
          <div className="text-[13px] font-semibold text-ink">{data.agencyName}</div>
        )}
        {/* Messaging isn't part of the build; the button stays visible but inactive. */}
        <button
          type="button"
          disabled
          className="rounded-lg border border-panel p-[9px] text-center text-[13px] font-medium text-ink"
        >
          Send a message
        </button>
      </SideCard>
    </>
  );
}
