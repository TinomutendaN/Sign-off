import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import { displayName, initials, shortDate } from "@/lib/format";
import type { getTeamSettings } from "../queries";
import { RolePill } from "./RolePill";
import { SettingsSection } from "./SettingsSection";

type Team = Awaited<ReturnType<typeof getTeamSettings>>;

type Row = {
  key: string;
  avatar: { label: string; tone: Parameters<typeof Avatar>[0]["tone"] };
  name: string;
  note: string;
  role: "Owner" | "Team member" | "Pending";
};

/** Team members from Clerk: avatar, name ("(you)"), note and role. Never an email. */
export function TeamMembersPanel({ team, userId, seatNote }: { team: Team; userId: string; seatNote: string }) {
  const payer = team.members.find((m) => m.isOwner)?.id;
  const rows: Row[] = [
    ...team.members.map((m) => ({
      key: m.id,
      avatar: { label: initials(m), tone: m.tone },
      name: `${displayName(m)}${m.id === userId ? " (you)" : ""}`,
      // The earliest Owner pays (TODO(Step 10): the subscription's payer from Clerk Billing).
      note: m.note ?? (m.id === payer ? "Pays for the workspace" : ""),
      role: m.isOwner ? ("Owner" as const) : ("Team member" as const),
    })),
    ...team.pending.map((p) => ({
      key: p.id,
      avatar: { label: p.name.slice(0, 2).toUpperCase(), tone: "grey" as const },
      name: `${p.name} (invited)`,
      note: `Invite sent ${shortDate(p.createdAt)}`,
      role: "Pending" as const,
    })),
  ];

  return (
    <SettingsSection title="Team members" aside={<span className="text-xs text-muted">{seatNote}</span>}>
      <Card className="flex flex-col px-4 py-1">
        {rows.map((r, i) => (
          <div
            key={r.key}
            className={cx(
              "flex flex-wrap items-center gap-[14px] py-[13px]",
              i < rows.length - 1 && "border-b border-soft-2",
            )}
          >
            <Avatar label={r.avatar.label} tone={r.avatar.tone} size={34} />
            <span className="min-w-0 flex-[1_1_200px] text-sm font-medium text-ink">{r.name}</span>
            <span className="min-w-[120px] text-xs text-muted">{r.note}</span>
            <RolePill role={r.role} wide />
          </div>
        ))}
      </Card>
    </SettingsSection>
  );
}
