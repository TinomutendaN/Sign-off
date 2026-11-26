"use client";

import { useState } from "react";
import { KanbanIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Tabs } from "@/components/ui/Tabs";
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

/** Search box, filter tabs with counts, and the project rows. */
export function ProjectsList({ projects, subtitle }: { projects: ProjectRowData[]; subtitle: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

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
        <Button href="/clients" icon={<PlusIcon />}>
          New project
        </Button>
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

      <section className="flex flex-col gap-[10px] rounded-column bg-panel p-[10px]">
        {rows.map((p) => (
          <ProjectRow key={p.id} project={p} />
        ))}
        {rows.length === 0 && (
          <div className="rounded-card border-[1.5px] border-dashed border-line-dash p-7 text-center text-[13px] text-muted">
            {q ? "No projects match your search." : "No projects here yet."}
          </div>
        )}
      </section>

      <div className="px-1 text-xs text-muted">Archived projects don&apos;t count towards your plan&apos;s project limit.</div>
    </>
  );
}
