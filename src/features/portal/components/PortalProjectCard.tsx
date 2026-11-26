import Link from "next/link";
import type { MilestoneStatus } from "@/generated/prisma/enums";
import { cx } from "@/components/ui/cx";
import { ProgressBar, type BarTone } from "@/components/ui/ProgressBar";
import { CLIENT_MILESTONE_LOOK } from "../wording";

const TAGS: Record<string, string> = {
  violet: "bg-violet",
  amber: "bg-amber",
  green: "bg-green",
  blue: "bg-blue",
  red: "bg-red",
};

type PortalProjectCardProps = {
  href: string;
  name: string;
  /** Theme colour token, e.g. "violet". */
  colour: string;
  due: string | null;
  progress: number;
  milestones: { id: string; label: string; status: MilestoneStatus }[];
};

/** Client home: a project with its overall progress and milestones in the client's words. */
export function PortalProjectCard({ href, name, colour, due, progress, milestones }: PortalProjectCardProps) {
  const tone = (colour in TAGS ? colour : "violet") as BarTone;
  return (
    <Link href={href} className="flex flex-col gap-3 rounded-card bg-card p-4 text-ink shadow-card hover:text-ink">
      <span className={cx("h-1 w-[30px] rounded-[2px]", TAGS[colour] ?? TAGS.violet)} />
      <span className="flex flex-col gap-[3px]">
        <span className="text-base font-semibold">{name}</span>
        {due && <span className="text-xs text-muted">Due {due}</span>}
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="flex justify-between text-xs">
          <span className="text-muted">Overall progress</span>
          <span className="font-semibold">{progress}%</span>
        </span>
        <ProgressBar value={progress} tone={tone} track="soft" height={6} label={`${name} progress`} />
      </span>
      {milestones.length > 0 && (
        <span className="flex flex-col gap-1.5 border-t border-soft-2 pt-1">
          {milestones.map((m) => {
            const look = CLIENT_MILESTONE_LOOK[m.status];
            return (
              <span key={m.id} className="flex items-center gap-2 pt-1 text-xs">
                <span className={cx("size-2 shrink-0 rounded-full", look.dot)} />
                <span className="flex-1 text-ink-2">{m.label}</span>
                <span className={cx("font-semibold", look.text)}>{look.label}</span>
              </span>
            );
          })}
        </span>
      )}
    </Link>
  );
}
