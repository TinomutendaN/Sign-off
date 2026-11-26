import { currentUser } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Section } from "@/components/ui/Section";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { toActivityLines } from "@/features/activity/queries";
import { getPlanIds, projectLimitReached } from "@/features/billing/queries";
import { DashboardProjectCard, type DashboardProject } from "@/features/dashboard/components/DashboardProjectCard";
import { DueRow } from "@/features/dashboard/components/DueRow";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { WaitingRow } from "@/features/dashboard/components/WaitingRow";
import { getDashboard } from "@/features/dashboard/queries";
import { NewProjectButton } from "@/features/projects/components/NewProjectButton";
import { milestoneLabel, projectKind, projectProgress } from "@/features/projects/progress";
import { BADGE, STATUS_LABEL, TYPE_TAG } from "@/features/tasks/labels";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { requireRole } from "@/lib/auth";
import { daysBetween, displayName, firstName, greeting, initials, longDay, shortDate, weekdayDate } from "@/lib/format";

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "Homepage design, version 2", or "… and 2 more" when there are several. */
function titleNote(titles: string[], empty: string) {
  if (titles.length === 0) return empty;
  return titles.length === 1 ? titles[0] : `${titles[0]} and ${titles.length - 1} more`;
}

function activeNote(clientNames: string[]) {
  const clients = [...new Set(clientNames)];
  if (clientNames.length === 0) return "No active projects yet";
  if (clients.length > 1) return `For ${clients.length} clients`;
  if (clientNames.length === 1) return `For ${clients[0]}`;
  return `${clientNames.length === 2 ? "Both" : "All"} for ${clients[0]}`;
}

function waitingFor(days: number) {
  return days <= 0 ? "waiting since today" : `waiting ${plural(days, "day")}`;
}

function EmptyBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border-[1.5px] border-dashed border-line-dash p-7 text-center text-[13px] text-muted">
      {children}
    </div>
  );
}

// 04 Dashboard
export default async function DashboardPage() {
  const { orgId } = await requireRole("MEMBER");
  const now = new Date();
  const [data, members, user, limitReached, planIds] = await Promise.all([
    getDashboard(orgId, now),
    getMemberDirectory(orgId),
    currentUser(),
    projectLimitReached(orgId),
    getPlanIds(),
  ]);

  const projects: DashboardProject[] = data.projects.map((p) => {
    const done = p.tasks.filter((t) => t.status === "DONE").length;
    return {
      id: p.id,
      name: p.name,
      colour: p.colour,
      clientName: p.client.name,
      due: p.dueDate ? shortDate(p.dueDate) : null,
      milestoneLabel: milestoneLabel(p.milestones),
      progress: projectProgress(p.milestones),
      tasks: `${plural(p.tasks.length, "task")} · ${done} done`,
      waiting: projectKind(p) === "waiting",
    };
  });

  const waiting = data.waiting.filter((d) => d.status === "WAITING");
  const changes = data.waiting.filter((d) => d.status === "CHANGES_REQUESTED");
  const newestFirst = (rows: typeof waiting) => [...rows].reverse().map((d) => d.title);

  const assignees = new Set(data.due.map((t) => t.assigneeId).filter(Boolean));
  const dueNote =
    data.due.length === 0
      ? "Nothing due this week"
      : assignees.size === 0
        ? "Not assigned yet"
        : `Shared by ${plural(assignees.size, "team member")}`;

  const activity = toActivityLines(data.activity, (row) => row.project?.client.name ?? "The client", members);

  return (
    <>
      <div className="flex flex-wrap items-center gap-[14px]">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
          <div className="text-xs text-muted">{longDay(now)}</div>
          <h1 className="m-0 text-[26px] font-medium tracking-[-0.01em] text-ink">
            {greeting(now)}, {firstName(user ?? {})}
          </h1>
        </div>
        <NotificationBell />
        <Button href="/clients" variant="outline">
          Invite a client
        </Button>
        <NewProjectButton limitReached={limitReached} planIds={planIds} />
      </div>

      <section
        aria-label="At a glance"
        className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[10px] rounded-column bg-panel p-[10px] tablet:grid-cols-2 phone:grid-cols-1"
      >
        <StatCard
          label="Active projects"
          value={projects.length}
          note={activeNote(projects.map((p) => p.clientName))}
          tone="violet"
        />
        <StatCard
          label="Waiting on clients"
          value={waiting.length}
          note={titleNote(newestFirst(waiting), "Nothing waiting right now")}
          tone="amber"
        />
        <StatCard
          label="Changes requested"
          value={changes.length}
          note={titleNote(newestFirst(changes), "No change requests")}
          tone="red"
        />
        <StatCard label="Due this week" value={data.due.length} note={dueNote} tone="blue" />
      </section>

      <div className="flex flex-wrap items-start gap-[14px]">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-[14px]">
          <Section title="Active projects" aside={<span className="text-xs text-muted">{projects.length}</span>}>
            {projects.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[10px]">
                {projects.map((p) => (
                  <DashboardProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <EmptyBox>No active projects yet. Invite a client to start one.</EmptyBox>
            )}
          </Section>

          <Section title="Waiting on clients" aside={<span className="text-xs text-muted">Approvals and change requests</span>}>
            {waiting.map((d) => (
              <WaitingRow
                key={d.id}
                kind="waiting"
                deliverableId={d.id}
                title={d.title}
                meta={`${d.clientName} · Sent ${shortDate(d.sentAt)}, ${waitingFor(daysBetween(d.sentAt, now))}`}
                reminded={d.reminded}
              />
            ))}
            {changes.map((d) => (
              <WaitingRow
                key={d.id}
                kind="changes"
                title={d.title}
                meta={d.comment ? `Changes requested: "${d.comment}"` : "Changes requested"}
                uploadHref={`/projects/${d.projectId}/milestones?replace=${d.id}`}
              />
            ))}
            {data.waiting.length === 0 && <EmptyBox>Nothing is waiting on clients.</EmptyBox>}
          </Section>
        </div>

        <div className="flex min-w-0 max-w-[380px] flex-[1_1_320px] flex-col gap-[14px] tablet:max-w-none">
          <Section title="Due this week" aside={<span className="text-xs text-muted">{data.due.length}</span>}>
            {data.due.length > 0 ? (
              <div className="flex flex-col rounded-card bg-card px-[14px] py-1 shadow-card">
                {data.due.map((t, i) => {
                  const member = members.find((m) => m.id === t.assigneeId);
                  const status =
                    t.deliverable && t.deliverable.status !== "APPROVED"
                      ? BADGE[t.deliverable.status].label
                      : STATUS_LABEL[t.status];
                  return (
                    <DueRow
                      key={t.id}
                      title={t.title}
                      when={`${weekdayDate(t.dueDate!)} · ${status}`}
                      tag={TYPE_TAG[t.type]}
                      assignee={member ? { name: displayName(member), initials: initials(member), tone: member.tone } : null}
                      last={i === data.due.length - 1}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyBox>Nothing due this week.</EmptyBox>
            )}
          </Section>

          {activity.length > 0 ? (
            <ActivityFeed title="Recent activity" compact lines={activity} />
          ) : (
            <Section title="Recent activity">
              <EmptyBox>No activity yet.</EmptyBox>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
