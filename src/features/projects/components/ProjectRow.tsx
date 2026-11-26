import Link from "next/link";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { cx } from "@/components/ui/cx";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar, type BarTone } from "@/components/ui/ProgressBar";
import type { Member } from "@/features/workspaces/queries";

export type ProjectKind = "waiting" | "active" | "archived";

export type ProjectRowData = {
  id: string;
  name: string;
  clientName: string;
  /** Theme colour token: "violet", "amber", "green"… ("idle" when archived). */
  colour: string;
  milestoneLabel: string;
  progress: number;
  dateLabel: "Due" | "Finished";
  date: string | null;
  team: Member[];
  kind: ProjectKind;
};

const bars: Record<string, string> = {
  violet: "bg-violet",
  amber: "bg-amber",
  green: "bg-green",
  blue: "bg-blue",
  red: "bg-red",
  idle: "bg-idle",
};

const pills = {
  waiting: { label: "Waiting on client", tone: "amber" },
  active: { label: "On track", tone: "green" },
  archived: { label: "Archived", tone: "grey" },
} as const;

/** One white project row: colour bar, name, current milestone and progress, due date, team, status. */
export function ProjectRow({ project }: { project: ProjectRowData }) {
  const pill = pills[project.kind];
  const barTone = (project.colour in bars ? project.colour : "violet") as BarTone;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-wrap items-center gap-[18px] rounded-card bg-card p-4 text-ink shadow-card hover:text-ink"
    >
      <span className="flex min-w-0 flex-[2_1_240px] items-center gap-[14px]">
        <span className={cx("h-10 w-1.5 shrink-0 rounded-[3px]", bars[project.colour] ?? bars.violet)} />
        <span className="flex min-w-0 flex-col gap-[3px]">
          <span className="truncate text-[15px] font-semibold">{project.name}</span>
          <span className="truncate text-xs text-muted">{project.clientName}</span>
        </span>
      </span>

      <span className="flex min-w-0 flex-[2_1_200px] flex-col gap-1.5">
        <span className="flex justify-between gap-2 text-xs">
          <span className="truncate text-muted">{project.milestoneLabel}</span>
          <span className="font-semibold">{project.progress}%</span>
        </span>
        <ProgressBar
          value={project.progress}
          tone={barTone}
          track="soft"
          height={6}
          label={`${project.name} progress`}
        />
      </span>

      <span className="flex flex-[1_1_120px] flex-col gap-0.5">
        <span className="text-[11px] text-muted">{project.dateLabel}</span>
        <span className="text-[13px] font-medium">{project.date ?? "No date"}</span>
      </span>

      <span className="flex flex-[1_1_100px] items-center">
        <AvatarStack people={project.team} size={28} />
      </span>

      <span className="flex flex-[0_0_150px] justify-end phone:flex-[1_1_auto] phone:justify-start">
        <Pill tone={pill.tone} size="md" className="px-[9px]">
          {pill.label}
        </Pill>
      </span>
    </Link>
  );
}
