import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GB, PLANS, storageLabel, type PlanKey } from "../plans";

type UsageCardProps = { plan: PlanKey; projects: number; members: number; storageBytes: number };

/** Billing's Usage card: projects, team members and file storage against the plan's limits. */
export function UsageCard({ plan, projects, members, storageBytes }: UsageCardProps) {
  const limits = PLANS[plan].limits;
  const rows = [
    {
      label: "Projects",
      used: String(projects),
      max: limits.projects === null ? "unlimited" : String(limits.projects),
      // "Unlimited" still shows a sliver, as in the paid design.
      pct: limits.projects === null ? 4 : (projects / limits.projects) * 100,
      full: limits.projects !== null && projects >= limits.projects,
    },
    {
      label: "Team members",
      used: String(members),
      max: String(limits.members),
      pct: (members / limits.members) * 100,
      full: members >= limits.members,
    },
    {
      label: "File storage",
      used: storageLabel(storageBytes),
      max: `${limits.storageGb} GB`,
      pct: (storageBytes / (limits.storageGb * GB)) * 100,
      full: storageBytes >= limits.storageGb * GB,
    },
  ];

  return (
    <Card className="flex flex-1 flex-col gap-[18px] p-5">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-[7px]">
          <div className="flex justify-between text-[13px]">
            <span className="font-medium">{row.label}</span>
            <span>
              <span className="font-semibold">{row.used}</span>
              <span className="text-muted"> of {row.max}</span>
            </span>
          </div>
          <ProgressBar
            value={row.pct}
            tone={row.full ? "amber" : "violet-bar"}
            track="soft"
            height={8}
            label={`${row.label} used`}
          />
        </div>
      ))}
    </Card>
  );
}
