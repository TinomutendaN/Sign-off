import { getProjectHeader } from "@/features/projects/queries";
import { getMemberDirectory } from "@/features/workspaces/queries";
import { dateTime, displayName, fileSize, initials, toDateInput } from "@/lib/format";
import type { Person, TaskDetail, TaskOptions } from "../board";
import { getTaskDetail } from "../queries";
import { TaskPanel } from "./TaskPanel";

type TaskPanelSlotProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  projectId: string;
  orgId: string;
  userId: string;
};

const FORMER: Person = { name: "A former team member", initials: "?", tone: "violet" };

/**
 * Opens the task panel when the address has ?task=id for a task on this project.
 * Any other value (missing, unknown, another project's task) shows nothing.
 */
export async function TaskPanelSlot({ searchParams, projectId, orgId, userId }: TaskPanelSlotProps) {
  const raw = (await searchParams).task;
  const taskId = typeof raw === "string" && raw.length > 0 && raw.length <= 40 ? raw : null;
  if (!taskId) return null;

  const [task, project, members] = await Promise.all([
    getTaskDetail(taskId, projectId, orgId),
    getProjectHeader(projectId, orgId),
    getMemberDirectory(orgId),
  ]);
  if (!task || !project) return null;

  const people = new Map<string, Person>(
    members.map((m) => [m.id, { name: displayName(m), initials: initials(m), tone: m.tone }]),
  );
  const now = new Date();

  const detail: TaskDetail = {
    id: task.id,
    projectName: project.name,
    title: task.title,
    description: task.description,
    type: task.type,
    status: task.status,
    assigneeId: task.assigneeId,
    due: task.dueDate ? toDateInput(task.dueDate) : null,
    milestoneId: task.milestoneId,
    files: task.files.map((f) => ({
      id: f.id,
      name: f.fileName,
      url: f.fileUrl,
      // Files from someone outside the team came from the client: show their company.
      from: people.get(f.addedById)?.name ?? project.client.name,
      size: fileSize(f.size),
    })),
    comments: task.comments.map((c) => ({
      id: c.id,
      author: people.get(c.authorId) ?? FORMER,
      when: dateTime(c.createdAt, now),
      text: c.text,
    })),
  };

  const options: TaskOptions = {
    team: members.map((m) => ({ id: m.id, person: people.get(m.id)! })),
    milestones: project.milestones.map((m) => ({ id: m.id, label: `${m.number}. ${m.name}` })),
    // The member list is cached for a few minutes, so someone who just joined may not be in it yet.
    me: people.get(userId) ?? { name: "You", initials: "?", tone: "violet" },
  };

  // Keyed by task so switching tasks starts fresh (draft, menus, optimistic values).
  return <TaskPanel key={detail.id} task={detail} options={options} />;
}
