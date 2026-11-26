import { SettingsIcon } from "@/components/icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PLANS } from "@/features/billing/plans";
import { getBillingState } from "@/features/billing/queries";
import { listClientAccess } from "@/features/clients/queries";
import { ClientAccessPanel } from "@/features/workspaces/components/ClientAccessPanel";
import { InviteTeamPanel } from "@/features/workspaces/components/InviteTeamPanel";
import { RolesPanel } from "@/features/workspaces/components/RolesPanel";
import { TeamMembersPanel } from "@/features/workspaces/components/TeamMembersPanel";
import { WorkspacePanel } from "@/features/workspaces/components/WorkspacePanel";
import { requestOrigin } from "@/features/workspaces/demo";
import { getTeamSettings } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";

// 09 Team settings. Everyone in the workspace can see it; only Owners can rename or invite.
export default async function SettingsPage() {
  const { orgId, userId, isOwner } = await requireRole("MEMBER");
  const [team, clients, origin, billing] = await Promise.all([
    getTeamSettings(orgId),
    listClientAccess(orgId),
    requestOrigin(),
    getBillingState(orgId),
  ]);

  const seats = team.members.length + team.pending.length;
  const plan = PLANS[billing.plan];
  const seatNote = `${seats} of ${plan.limits.members} team members on ${plan.name}`;

  return (
    <>
      <ScreenHeader icon={<SettingsIcon size={22} />} title="Team & workspace" subtitle={`${team.name} · ${seatNote}`} />
      <div className="flex flex-wrap items-start gap-[14px]">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-[14px]">
          <WorkspacePanel
            name={team.name}
            portalAddress={`${origin.replace(/^https?:\/\//, "")}/portal`}
            canEdit={isOwner}
          />
          <TeamMembersPanel team={team} userId={userId} seatNote={seatNote} />
          <ClientAccessPanel clients={clients} />
        </div>
        <div className="flex max-w-[380px] min-w-0 flex-[1_1_320px] flex-col gap-[14px] tablet:max-w-none">
          {isOwner && <InviteTeamPanel />}
          <RolesPanel />
        </div>
      </div>
    </>
  );
}
