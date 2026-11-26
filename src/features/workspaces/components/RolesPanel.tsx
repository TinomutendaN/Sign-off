import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import { SettingsSection } from "./SettingsSection";

const RIGHTS = [
  { role: "Owner", text: "Manages the workspace, team, clients and billing. Can do everything a team member can." },
  { role: "Team member", text: "Works on projects and tasks, uploads deliverables and sends them for approval." },
  { role: "Client", text: "Sees only their own projects. Can approve work or ask for changes. Never pays." },
];

/** "What each role can do". */
export function RolesPanel() {
  return (
    <SettingsSection title="What each role can do">
      <Card className="flex flex-col px-4 py-1">
        {RIGHTS.map((r, i) => (
          <div
            key={r.role}
            className={cx("flex flex-col gap-[3px] py-3", i < RIGHTS.length - 1 && "border-b border-soft-2")}
          >
            <span className="text-[13px] font-semibold text-ink">{r.role}</span>
            <span className="text-xs leading-normal text-muted">{r.text}</span>
          </div>
        ))}
      </Card>
    </SettingsSection>
  );
}
