"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { FilterIcon } from "@/components/icons";
import { Tabs } from "@/components/ui/Tabs";

const TABS = [
  { key: "board", label: "Board", path: "" },
  { key: "list", label: "List", path: "/list" },
  { key: "milestones", label: "Milestones", path: "/milestones" },
  { key: "activity", label: "Activity", path: "/activity" },
] as const;

/** Board, List, Milestones and Activity as real links, with "Filter" at the right. */
export function ProjectTabs({ projectId }: { projectId: string }) {
  return (
    <Suspense fallback={<TabsView projectId={projectId} pathname={null} />}>
      <TabsWithPath projectId={projectId} />
    </Suspense>
  );
}

function TabsWithPath({ projectId }: { projectId: string }) {
  return <TabsView projectId={projectId} pathname={usePathname()} />;
}

function TabsView({ projectId, pathname }: { projectId: string; pathname: string | null }) {
  const base = `/projects/${projectId}`;
  return (
    <Tabs
      label="Project views"
      items={TABS.map((t) => ({
        key: t.key,
        label: t.label,
        href: base + t.path,
        square: true,
        selected: pathname === base + t.path,
      }))}
      end={
        // The design shows "Filter" but has no filter panel for the board yet; the List tab has filters.
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex items-center gap-1.5 bg-transparent p-2 text-[13px] text-muted opacity-60"
        >
          <FilterIcon />
          Filter
        </button>
      }
    />
  );
}
