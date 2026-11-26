import type { ActivityType, ActorKind, Prisma } from "@/generated/prisma/client";

type ActivityInput = {
  orgId: string;
  projectId: string | null;
  actorId: string;
  actorKind?: ActorKind;
  type: ActivityType;
  subject: string;
  detail?: string | null;
  visibleToClient?: boolean;
  /** Defaults to now. Set it when one action records two lines, so they sort in order. */
  createdAt?: Date;
};

/** The one place that writes an activity line. Call it inside the action's transaction. */
export async function recordActivity(tx: Prisma.TransactionClient, input: ActivityInput) {
  await tx.activity.create({
    data: {
      orgId: input.orgId,
      projectId: input.projectId,
      actorId: input.actorId,
      actorKind: input.actorKind ?? "TEAM",
      type: input.type,
      subject: input.subject,
      detail: input.detail ?? null,
      visibleToClient: input.visibleToClient ?? false,
      ...(input.createdAt && { createdAt: input.createdAt }),
    },
  });
}
