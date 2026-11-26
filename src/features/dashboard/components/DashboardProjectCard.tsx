import Link from "next/link";
import { cx } from "@/components/ui/cx";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar, type BarTone } from "@/components/ui/ProgressBar";

const TAGS: Record<string, string> = {
  violet: "bg-violet",
  amber: "bg-amber",
  green: "bg-green",
  blue: "bg-blue",
  red: "bg-red",
};

export type DashboardProject = {
  id: string;
  name: string;
  /** Theme colour token, e.g. "violet". */
  colour: string;
  clientName: string;
  due: string | null;
  milestoneLabel: string;
  progress: number;
  tasks: string;
  waiting: boolean;
};

/** An active project: colour tag, name, current milestone and progress, task count and status. */
export function DashboardProjectCard({ project }: { project: DashboardProject }) {
  const tone = (project.colour in TAGS ? project.colour : "violet") as BarTone;
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex min-w-0 flex-col gap-3 rounded-card bg-card p-4 text-ink shadow-card hover:text-ink"
    >
      <span className={cx("h-1 w-[30px] rounded-[2px]", TAGS[project.colour] ?? TAGS.violet)} />
      <span className="flex flex-col gap-[3px]">
        <span className="truncate text-base font-semibold">{project.name}</span>
        <span className="truncate text-xs text-muted">
          {project.clientName}
          {project.due && ` · Due ${project.due}`}
        </span>
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="flex justify-between gap-2 text-xs">
          <span className="truncate text-muted">{project.milestoneLabel}</span>
          <span className="font-semibold">{project.progress}%</span>
        </span>
        <ProgressBar value={project.progress} tone={tone} track="soft" height={6} label={`${project.name} progress`} />
      </span>
      <span className="flex items-center gap-3 text-xs text-muted">
        <span>{project.tasks}</span>
        <span className="flex-1" />
        <Pill tone={project.waiting ? "amber" : "green"} className="text-xs">
          {project.waiting ? "Waiting on client" : "On track"}
        </Pill>
      </span>
    </Link>
  );
}
