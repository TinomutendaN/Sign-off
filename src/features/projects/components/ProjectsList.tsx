"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KanbanIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Tabs } from "@/components/ui/Tabs";
import { UpgradePrompt } from "@/features/billing/components/UpgradePrompt";
import type { PaidPlanKey } from "@/features/billing/plans";
import { archiveProject } from "../actions";
import { ProjectRow, type ProjectKind, type ProjectRowData } from "./ProjectRow";

type Filter = "all" | "active" | "waiting" | "archived";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "waiting", label: "Waiting on client" },
  { key: "archived", label: "Archived" },
];

// As in the design: "All" leaves archived projects out; "Active" includes those waiting on the client.
function matches(kind: ProjectKind, filter: Filter) {
  if (filter === "all") return kind !== "archived";
  if (filter === "active") return kind === "active" || kind === "waiting";
  return kind === filter;
}

type ProjectsListProps = {
  projects: ProjectRowData[];
  subtitle: string;
  /** The plan allows no more active projects: "+ New project" opens the upgrade pop-up. */
  limitReached: boolean;
  planIds: Record<PaidPlanKey, string | null>;
  /** ?archive=1: show Archive buttons on active rows (Owners) and a hint. */
  archiveMode: boolean;
  canArchive: boolean;
};

/** Search box, filter tabs with counts, and the project rows. */
export function ProjectsList({ projects, subtitle, limitReached, planIds, archiveMode, canArchive }: ProjectsListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [upgrade, setUpgrade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiving, startArchive] = useTransition();

  function archive(projectId: string) {
    setError(null);
    startArchive(async () => {
      const result = await archiveProject({ projectId });
      if (!result.ok) return setError(result.error);
      router.replace("/projects");
    });
  }

  const q = query.trim().toLowerCase();
  const rows = projects.filter(
    (p) =>
      matches(p.kind, filter) &&
      (!q || p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)),
  );

  return (
    <>
      <ScreenHeader icon={<KanbanIcon size={22} />} title="Projects" subtitle={subtitle}>
        <label className="flex w-[220px] items-center gap-2 rounded-control border border-panel px-3 py-[9px] text-[13px] text-muted shadow-xs phone:w-full">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="w-full border-0 bg-transparent text-ink outline-none placeholder:text-muted"
          />
        </label>
        {limitReached ? (
          <Button icon={<PlusIcon />} onClick={() => setUpgrade(true)}>
            New project
          </Button>
        ) : (
          <Button href="/clients" icon={<PlusIcon />}>
            New project
          </Button>
        )}
      </ScreenHeader>

      <Tabs
        label="Filter projects"
        onSelect={(key) => setFilter(key as Filter)}
        items={FILTERS.map((f) => ({
          key: f.key,
          label: f.label,
          selected: filter === f.key,
          count: projects.filter((p) => matches(p.kind, f.key)).length,
        }))}
      />

      {archiveMode && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-side bg-violet-tint px-4 py-3 text-sm text-violet-ink">
          <span className="flex-[1_1_300px]">
            {canArchive
              ? "Choose a project to archive. Archived projects don't count towards your plan's project limit."
              : "Only the workspace owner can archive projects."}
          </span>
          <Link href="/projects" className="text-[13px] font-semibold">
            Done
          </Link>
        </div>
      )}
      {error && (
        <p role="alert" className="m-0 px-1 text-[13px] text-red-ink">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-[10px] rounded-column bg-panel p-[10px]">
        {rows.map((p) =>
          archiveMode && canArchive && p.kind !== "archived" ? (
            <div key={p.id} className="flex items-center gap-[10px] phone:flex-col phone:items-stretch">
              <div className="min-w-0 flex-1">
                <ProjectRow project={p} />
              </div>
              <Button variant="outline" disabled={archiving} onClick={() => archive(p.id)}>
                Archive
              </Button>
            </div>
          ) : (
            <ProjectRow key={p.id} project={p} />
          ),
        )}
        {rows.length === 0 && (
          <div className="rounded-card border-[1.5px] border-dashed border-line-dash p-7 text-center text-[13px] text-muted">
            {q ? "No projects match your search." : "No projects here yet."}
          </div>
        )}
      </section>

      <div className="px-1 text-xs text-muted">Archived projects don&apos;t count towards your plan&apos;s project limit.</div>
      <UpgradePrompt open={upgrade} onClose={() => setUpgrade(false)} planIds={planIds} />
    </>
  );
}
