// Demo data for SIGNoFF. Mirrors the screen designs in design/screens/.
// Run by `npx prisma db seed` (prisma/seed.ts) and by the nightly cron (/api/cron/reset-demo).
//
// Safe to re-run: it deletes and recreates only demo data
//   - agency data belonging to DEMO_ORG_ID (Northfold Studio)
//   - Subscription rows with isDemo = true, and Northfold's own (non-demo) rows
//   - Northfold's Clerk Billing plan (back to Free) and visitors' Blob uploads under orgs/{DEMO_ORG_ID}/
//   - the team notes on the Northfold memberships in Clerk (publicMetadata.note)
//   - what visitors did in Clerk (resetDemoClerk): invitations, extra members, invited client
//     accounts, the workspace name and its member limit
// Real sign-ups (other organizations, isDemo = false) are never touched.
//
// Dates: every date is an offset from an anchor day, so the live demo never goes stale.
// The anchor is DEMO_ANCHOR_DATE (YYYY-MM-DD) or, if unset, today in Harare.
// DEMO_ANCHOR_DATE=2026-11-24 reproduces the designs exactly.
//
// The settings below are read when a reset starts (init), not when the file loads, so a
// long-lived server process re-reads today's date on every nightly run.

import { statSync } from "node:fs";
import { join } from "node:path";
import { createClerkClient } from "@clerk/nextjs/server";
import { PLANS } from "@/features/billing/plans";
import type { BillingPeriod, Plan, Prisma, PrismaClient } from "@/generated/prisma/client";
import { resetDemoBilling, resetDemoFiles } from "./demoReset";

// ---------- Environment ----------

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Add the Clerk IDs for the demo people and workspace, then run the reset again.`,
    );
  }
  return value;
}

let db: PrismaClient;
let clerk: ReturnType<typeof createClerkClient>;
let ORG: string;
let TINO: string;
let LEO: string;
let AMA: string;
let JEN: string;
let THANDI: string;
let ADMIN: string | undefined;
let ANCHOR: { y: number; m: number; d: number };
let TEAM_NOTES: [userId: string, note: string][];

function init(database: PrismaClient) {
  db = database;
  ORG = requireEnv("DEMO_ORG_ID");
  TINO = requireEnv("DEMO_OWNER_USER_ID");
  LEO = requireEnv("DEMO_LEO_USER_ID");
  AMA = requireEnv("DEMO_AMA_USER_ID");
  JEN = requireEnv("DEMO_JEN_USER_ID");
  THANDI = requireEnv("DEMO_CLIENT_USER_ID");
  ADMIN = process.env.DEMO_ADMIN_USER_ID?.trim();
  clerk = createClerkClient({ secretKey: requireEnv("CLERK_SECRET_KEY") });
  ANCHOR = anchorParts();
  // The note under each team member's name (Team settings, and the client portal's
  // "YOUR AGENCY" card). The Owner's "Pays for the workspace" comes from the role, not a note.
  TEAM_NOTES = [
    [LEO, "Project lead"],
    [AMA, "Content"],
    [JEN, "Developer"],
  ];
}

// ---------- Dates ----------

const TIME_ZONE = "Africa/Harare";
const UTC_OFFSET = "+02:00"; // Harare has no daylight saving

function anchorParts(): { y: number; m: number; d: number } {
  const fromEnv = process.env.DEMO_ANCHOR_DATE?.trim();
  const ymd =
    fromEnv || new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) throw new Error(`DEMO_ANCHOR_DATE must look like 2026-11-24, got "${ymd}".`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}


function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localDate(y: number, monthIndex: number, day: number, time: string): Date {
  // Normalise overflow (e.g. day 0, month 12) with UTC maths, then build a Harare-time instant.
  const d = new Date(Date.UTC(y, monthIndex, day));
  const ymd = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return new Date(`${ymd}T${time}:00${UTC_OFFSET}`);
}

/** A day relative to the anchor (0 = anchor day, -2 = two days before) at a Harare time. */
function day(offset: number, time = "09:00"): Date {
  return localDate(ANCHOR.y, ANCHOR.m - 1, ANCHOR.d + offset, time);
}

function daysInMonth(y: number, monthIndex: number): number {
  return new Date(Date.UTC(y, monthIndex + 1, 0)).getUTCDate();
}

/** A day of a month relative to the anchor's month (0 = anchor month, 1 = last month). */
function monthDay(monthsAgo: number, dayOfMonth: number, time = "10:00"): Date {
  const first = new Date(Date.UTC(ANCHOR.y, ANCHOR.m - 1 - monthsAgo, 1));
  const y = first.getUTCFullYear();
  const mi = first.getUTCMonth();
  return localDate(y, mi, Math.min(dayOfMonth, daysInMonth(y, mi)), time);
}

/**
 * A sample file in public/demo-files. Name, URL and size come from the real file, so every
 * Download link works and the sizes shown are honest.
 */
function demoFile(fileName: string) {
  return { fileName, fileUrl: `/demo-files/${fileName}`, size: statSync(join(process.cwd(), "public", "demo-files", fileName)).size };
}

// ---------- Reset ----------

async function reset(tx: Prisma.TransactionClient) {
  await tx.activity.deleteMany({ where: { orgId: ORG } });
  // Cascades remove milestones, tasks, comments, files, deliverables, decisions and client access.
  await tx.project.deleteMany({ where: { orgId: ORG } });
  await tx.client.deleteMany({ where: { orgId: ORG } });
  await tx.subscription.deleteMany({ where: { isDemo: true } });
}

// ---------- Agency data (Northfold Studio) ----------

type CommentSeed = { by: string; at: Date; text: string };

async function seedAgency(tx: Prisma.TransactionClient) {
  const bakery = await tx.client.create({
    data: {
      orgId: ORG,
      name: "Brightline Bakery",
      contactName: "Thandi M.",
      contactEmail: "thandi@brightline.example",
      createdAt: day(-30),
    },
  });

  // ----- Website redesign -----
  const website = await tx.project.create({
    data: {
      orgId: ORG,
      clientId: bakery.id,
      name: "Website redesign",
      dueDate: day(18, "17:00"),
      colour: "violet",
      createdAt: day(-28),
    },
  });

  const [brand, pages, build] = await Promise.all([
    tx.milestone.create({
      data: {
        projectId: website.id,
        number: 1,
        name: "Brand & sitemap",
        dueDate: day(-6, "17:00"),
        status: "APPROVED",
        approvedAt: day(-6, "14:10"),
      },
    }),
    tx.milestone.create({
      data: {
        projectId: website.id,
        number: 2,
        name: "Page designs",
        dueDate: day(4, "17:00"),
        status: "WAITING",
      },
    }),
    tx.milestone.create({
      data: {
        projectId: website.id,
        number: 3,
        name: "Build & launch",
        dueDate: day(18, "17:00"),
        status: "UP_NEXT",
      },
    }),
  ]);

  type TaskSeed = {
    title: string;
    description?: string;
    type: "DESIGN" | "BUILD" | "CONTENT" | "FIX";
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    order: number;
    assignee: string;
    due: Date;
    milestoneId: string;
    completedAt?: Date;
    createdAt: Date;
    comments: CommentSeed[];
  };

  const websiteTasks: TaskSeed[] = [
    // To do
    {
      title: "Write copy for the Our Story page",
      type: "CONTENT",
      status: "TODO",
      order: 1000,
      assignee: AMA,
      due: day(8, "17:00"),
      milestoneId: build.id,
      createdAt: day(-9),
      comments: [
        { by: AMA, at: day(-3, "10:20"), text: "Thandi sent the founding story notes. Drafting from those." },
        { by: LEO, at: day(-2, "09:45"), text: "Keep it under 250 words so it fits the layout." },
      ],
    },
    {
      title: "Set up online ordering form",
      type: "BUILD",
      status: "TODO",
      order: 2000,
      assignee: JEN,
      due: day(11, "17:00"),
      milestoneId: build.id,
      createdAt: day(-8),
      comments: [],
    },
    {
      title: "Photograph seasonal menu items",
      description: "Breads, pastries and the new winter cakes, shot on the shop counter.",
      type: "CONTENT",
      status: "TODO",
      order: 3000,
      assignee: LEO,
      due: day(12, "17:00"),
      milestoneId: build.id,
      createdAt: day(-8),
      comments: [{ by: LEO, at: day(-1, "16:10"), text: "Shoot is booked for the morning before opening." }],
    },
    // In progress
    {
      title: "Build menu page with prices",
      description:
        "Pull prices from the sheet the client shared and group them by category. Winter cakes go at the top. Each item needs a name, a short description and a price.",
      type: "BUILD",
      status: "IN_PROGRESS",
      order: 1000,
      assignee: TINO,
      due: day(4, "17:00"),
      milestoneId: build.id,
      createdAt: day(-7),
      comments: [
        {
          by: JEN,
          at: day(0, "09:10"),
          text: "The price sheet has two tabs. I think the second one is the old menu.",
        },
        { by: TINO, at: day(0, "09:32"), text: "Good catch. Using the first tab only." },
        {
          by: LEO,
          at: day(0, "11:05"),
          text: "Match the card style from the homepage design so it feels like one site.",
        },
        { by: TINO, at: day(0, "14:20"), text: "Prices are in on staging. Adding the short descriptions next." },
      ],
    },
    {
      title: "Fix image sizes on mobile",
      type: "FIX",
      status: "IN_PROGRESS",
      order: 2000,
      assignee: JEN,
      due: day(2, "17:00"),
      milestoneId: build.id,
      createdAt: day(-5),
      comments: [
        { by: JEN, at: day(-2, "10:05"), text: "The hero image is 2.4 MB on mobile. Switching to responsive sizes." },
        { by: TINO, at: day(-2, "11:30"), text: "Check the gallery too, it jumps on iPhone." },
        { by: JEN, at: day(-1, "15:50"), text: "Gallery fixed. Hero is next." },
      ],
    },
    // In review
    {
      title: "Homepage design, version 2",
      type: "DESIGN",
      status: "IN_REVIEW",
      order: 1000,
      assignee: LEO,
      due: day(1, "17:00"),
      milestoneId: pages.id,
      createdAt: day(-14),
      comments: [
        { by: LEO, at: day(-3, "09:30"), text: "Version 2 moves the order button above the fold." },
        { by: TINO, at: day(-3, "10:15"), text: "Use the warmer photo Thandi picked." },
        { by: AMA, at: day(-3, "14:40"), text: "Updated the headline to match the new copy." },
        { by: LEO, at: day(-2, "13:55"), text: "Exported the PDF for the client." },
        { by: TINO, at: day(-2, "15:20"), text: "Looks good. Send it." },
        { by: LEO, at: day(-2, "15:42"), text: "Sent. I'll follow up if we don't hear back in two days." },
      ],
    },
    {
      title: "Logo refresh options",
      type: "DESIGN",
      status: "IN_REVIEW",
      order: 2000,
      assignee: LEO,
      due: day(0, "17:00"),
      milestoneId: pages.id,
      createdAt: day(-12),
      comments: [
        { by: LEO, at: day(-3, "09:40"), text: "They want the wheat icon in their brown. Trying three shades." },
        { by: AMA, at: day(-2, "10:30"), text: "The brown from the shop sign matches best." },
      ],
    },
    // Done
    {
      title: "Sitemap and page list",
      type: "CONTENT",
      status: "DONE",
      order: 1000,
      assignee: AMA,
      due: day(-10, "17:00"),
      milestoneId: brand.id,
      completedAt: day(-10, "16:45"),
      createdAt: day(-25),
      comments: [
        { by: AMA, at: day(-13, "11:00"), text: "First draft of the page list is in the doc." },
        { by: LEO, at: day(-13, "14:20"), text: "Add a separate page for wholesale orders." },
        { by: AMA, at: day(-12, "09:15"), text: "Added. Sending it to Thandi for sign-off." },
      ],
    },
    {
      title: "Colour palette and fonts",
      type: "DESIGN",
      status: "DONE",
      order: 2000,
      assignee: LEO,
      due: day(-6, "17:00"),
      milestoneId: brand.id,
      completedAt: day(-6, "14:05"),
      createdAt: day(-22),
      comments: [
        { by: LEO, at: day(-10, "10:00"), text: "Two palettes ready: warm cream and bakery brown." },
        { by: TINO, at: day(-10, "11:25"), text: "Go with the brown, it matches the shop." },
        { by: AMA, at: day(-9, "09:50"), text: "Headings in a soft serif, body text in Inter." },
        { by: LEO, at: day(-9, "15:30"), text: "Contrast checks pass on all text colours." },
        { by: LEO, at: day(-6, "14:05"), text: "Approved by Thandi. Moving to done." },
      ],
    },
    {
      title: "Domain and hosting setup",
      type: "BUILD",
      status: "DONE",
      order: 3000,
      assignee: TINO,
      due: day(-5, "17:00"),
      milestoneId: brand.id,
      completedAt: day(-5, "17:30"),
      createdAt: day(-20),
      comments: [{ by: TINO, at: day(-5, "17:25"), text: "DNS moved and SSL is live." }],
    },
  ];

  const taskIds: Record<string, string> = {};
  for (const t of websiteTasks) {
    const task = await tx.task.create({
      data: {
        projectId: website.id,
        milestoneId: t.milestoneId,
        title: t.title,
        description: t.description,
        type: t.type,
        status: t.status,
        order: t.order,
        assigneeId: t.assignee,
        dueDate: t.due,
        completedAt: t.completedAt,
        createdAt: t.createdAt,
        comments: {
          create: t.comments.map((c) => ({ authorId: c.by, text: c.text, createdAt: c.at })),
        },
      },
    });
    taskIds[t.title] = task.id;
  }

  await tx.taskFile.create({
    data: {
      taskId: taskIds["Build menu page with prices"],
      ...demoFile("brightline-prices.xlsx"),
      addedById: THANDI,
      createdAt: day(-7, "12:00"),
    },
  });

  // Deliverables and the client's decisions
  const sitemapDel = await tx.deliverable.create({
    data: {
      milestoneId: brand.id,
      title: "Sitemap and page list",
      ...demoFile("sitemap.pdf"),
      note: "Every page we plan to build, including the new wholesale page.",
      status: "APPROVED",
      sentById: AMA,
      sentAt: day(-12, "09:20"),
      decisions: { create: { clientUserId: THANDI, kind: "APPROVED", createdAt: day(-10, "16:40") } },
    },
  });
  const paletteDel = await tx.deliverable.create({
    data: {
      milestoneId: brand.id,
      title: "Colour palette and fonts",
      ...demoFile("palette.pdf"),
      note: "The bakery brown palette with the heading and body fonts.",
      status: "APPROVED",
      sentById: LEO,
      sentAt: day(-8, "11:10"),
      decisions: { create: { clientUserId: THANDI, kind: "APPROVED", createdAt: day(-6, "14:02") } },
    },
  });
  const logoDel = await tx.deliverable.create({
    data: {
      milestoneId: pages.id,
      title: "Logo refresh options",
      ...demoFile("logo-options.pdf"),
      note: "Three takes on the wheat mark. Which one feels most like Brightline?",
      status: "CHANGES_REQUESTED",
      sentById: LEO,
      sentAt: day(-4, "10:15"),
      decisions: {
        create: {
          clientUserId: THANDI,
          kind: "CHANGES_REQUESTED",
          comment: "Can we try the wheat icon in our brown?",
          createdAt: day(-3, "09:12"),
        },
      },
    },
  });
  const homepageDel = await tx.deliverable.create({
    data: {
      milestoneId: pages.id,
      title: "Homepage design, version 2",
      ...demoFile("homepage-v2.pdf"),
      // The client's preview box shows the design's illustration of the PDF.
      previewUrl: "/demo-files/homepage-v2-preview.png",
      note: "We moved the order button above the fold and used the warmer photo you picked. Let us know if the menu section feels right.",
      status: "WAITING",
      sentById: LEO,
      sentAt: day(-2, "15:40"),
    },
  });

  // Each sent deliverable belongs to the task it came from; the card badge reads its status.
  for (const [title, deliverable] of [
    ["Sitemap and page list", sitemapDel],
    ["Colour palette and fonts", paletteDel],
    ["Logo refresh options", logoDel],
    ["Homepage design, version 2", homepageDel],
  ] as const) {
    await tx.task.update({ where: { id: taskIds[title] }, data: { deliverableId: deliverable.id } });
  }

  // ----- Spring campaign -----
  const spring = await tx.project.create({
    data: {
      orgId: ORG,
      clientId: bakery.id,
      name: "Spring campaign",
      dueDate: day(21, "17:00"),
      colour: "amber",
      createdAt: day(-14),
    },
  });
  const [plan, visuals] = await Promise.all([
    tx.milestone.create({
      data: { projectId: spring.id, number: 1, name: "Campaign plan", dueDate: day(10, "17:00"), status: "IN_PROGRESS" },
    }),
    tx.milestone.create({
      data: { projectId: spring.id, number: 2, name: "Visuals", dueDate: day(21, "17:00"), status: "UP_NEXT" },
    }),
  ]);
  const springTasks: Omit<TaskSeed, "comments" | "createdAt">[] = [
    { title: "Agree campaign goals with Thandi", type: "CONTENT", status: "DONE", order: 1000, assignee: AMA, due: day(-9, "17:00"), milestoneId: plan.id, completedAt: day(-9, "15:00") },
    { title: "Draft the spring offers list", type: "CONTENT", status: "IN_PROGRESS", order: 1000, assignee: LEO, due: day(9, "17:00"), milestoneId: plan.id },
    { title: "Plan the social posting calendar", type: "CONTENT", status: "TODO", order: 1000, assignee: AMA, due: day(10, "17:00"), milestoneId: plan.id },
    { title: "Outline the spring email newsletter", type: "CONTENT", status: "TODO", order: 2000, assignee: AMA, due: day(13, "17:00"), milestoneId: plan.id },
    { title: "Choose in-store poster sizes", type: "DESIGN", status: "TODO", order: 3000, assignee: LEO, due: day(14, "17:00"), milestoneId: plan.id },
    { title: "Moodboard for spring visuals", type: "DESIGN", status: "TODO", order: 4000, assignee: LEO, due: day(19, "17:00"), milestoneId: visuals.id },
  ];
  for (const t of springTasks) {
    await tx.task.create({
      data: {
        projectId: spring.id,
        milestoneId: t.milestoneId,
        title: t.title,
        type: t.type,
        status: t.status,
        order: t.order,
        assigneeId: t.assignee,
        dueDate: t.due,
        completedAt: t.completedAt,
        createdAt: day(-13),
      },
    });
  }

  // ----- Holiday menu flyer (archived, last year's festive season) -----
  const flyer = await tx.project.create({
    data: {
      orgId: ORG,
      clientId: bakery.id,
      name: "Holiday menu flyer",
      dueDate: day(-340, "17:00"),
      status: "ARCHIVED",
      colour: "green",
      createdAt: day(-370),
    },
  });
  const flyerMilestone = await tx.milestone.create({
    data: {
      projectId: flyer.id,
      number: 1,
      name: "Flyer design",
      dueDate: day(-342, "17:00"),
      status: "APPROVED",
      approvedAt: day(-342, "11:00"),
    },
  });
  for (const [i, t] of (
    [
      { title: "Design the holiday menu flyer", type: "DESIGN", assignee: LEO },
      { title: "Send print-ready files to the printer", type: "BUILD", assignee: JEN },
    ] as const
  ).entries()) {
    await tx.task.create({
      data: {
        projectId: flyer.id,
        milestoneId: flyerMilestone.id,
        title: t.title,
        type: t.type,
        status: "DONE",
        order: (i + 1) * 1000,
        assigneeId: t.assignee,
        dueDate: day(-342, "17:00"),
        completedAt: day(-342 + i, "16:00"),
        createdAt: day(-365),
      },
    });
  }

  // Thandi sees the two live projects only.
  await tx.clientAccess.createMany({
    data: [website.id, spring.id].map((projectId) => ({
      userId: THANDI,
      clientId: bakery.id,
      projectId,
      createdAt: day(-28),
    })),
  });

  // ----- Activity (structured; worded per viewer when shown) -----
  type ActivitySeed = Omit<Prisma.ActivityCreateManyInput, "orgId">;
  const activity: ActivitySeed[] = [
    { projectId: flyer.id, actorId: THANDI, actorKind: "CLIENT", type: "DELIVERABLE_APPROVED", subject: "Holiday menu flyer", visibleToClient: true, createdAt: day(-342, "11:00") },
    { projectId: website.id, actorId: TINO, actorKind: "TEAM", type: "PROJECT_CREATED", subject: "Website redesign", visibleToClient: true, createdAt: day(-28, "09:00") },
    { projectId: website.id, actorId: AMA, actorKind: "TEAM", type: "DELIVERABLE_SENT", subject: "Sitemap and page list", visibleToClient: true, createdAt: day(-12, "09:20") },
    { projectId: spring.id, actorId: TINO, actorKind: "TEAM", type: "PROJECT_CREATED", subject: "Spring campaign", visibleToClient: true, createdAt: day(-14, "10:00") },
    { projectId: website.id, actorId: THANDI, actorKind: "CLIENT", type: "DELIVERABLE_APPROVED", subject: "Sitemap and page list", visibleToClient: true, createdAt: day(-10, "16:40") },
    { projectId: spring.id, actorId: AMA, actorKind: "TEAM", type: "TASK_DONE", subject: "Agree campaign goals with Thandi", visibleToClient: false, createdAt: day(-9, "15:00") },
    { projectId: website.id, actorId: LEO, actorKind: "TEAM", type: "DELIVERABLE_SENT", subject: "Colour palette and fonts", visibleToClient: true, createdAt: day(-8, "11:10") },
    { projectId: website.id, actorId: THANDI, actorKind: "CLIENT", type: "DELIVERABLE_APPROVED", subject: "Colour palette and fonts", visibleToClient: true, createdAt: day(-6, "14:02") },
    { projectId: website.id, actorId: AMA, actorKind: "TEAM", type: "MILESTONE_COMPLETED", subject: "Brand & sitemap", detail: "1", visibleToClient: true, createdAt: day(-6, "14:10") },
    { projectId: website.id, actorId: TINO, actorKind: "TEAM", type: "TASK_DONE", subject: "Domain and hosting setup", visibleToClient: true, createdAt: day(-5, "17:30") },
    { projectId: website.id, actorId: THANDI, actorKind: "CLIENT", type: "CHANGES_REQUESTED", subject: "Logo refresh options", detail: "Can we try the wheat icon in our brown?", visibleToClient: true, createdAt: day(-3, "09:12") },
    { projectId: website.id, actorId: LEO, actorKind: "TEAM", type: "DELIVERABLE_REPLY", subject: "Logo refresh options", detail: "a brown version is coming this week", visibleToClient: true, createdAt: day(-2, "11:05") },
    { projectId: website.id, actorId: LEO, actorKind: "TEAM", type: "DELIVERABLE_SENT", subject: "Homepage design, version 2", visibleToClient: true, createdAt: day(-2, "15:40") },
    { projectId: website.id, actorId: TINO, actorKind: "TEAM", type: "TASK_COMMENTED", subject: "Build menu page with prices", visibleToClient: false, createdAt: day(0, "14:20") },
  ];
  await tx.activity.createMany({ data: activity.map((a) => ({ ...a, orgId: ORG })) });
}

// ---------- Subscriptions (admin dashboard history) ----------

/** Dollars → cents (189.96 → 18996). */
function cents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Prices per period in cents, from features/billing/plans.ts (what Clerk charges).
const PRICE: Record<"PRO" | "AGENCY", Record<BillingPeriod, number>> = {
  PRO: { MONTHLY: cents(PLANS.pro.monthly), ANNUAL: cents(PLANS.pro.annual) },
  AGENCY: { MONTHLY: cents(PLANS.agency.monthly), ANNUAL: cents(PLANS.agency.annual) },
};

type Kind = "PM" | "PA" | "AM" | "AA";
const KIND: Record<Kind, { plan: Plan; period: BillingPeriod }> = {
  PM: { plan: "PRO", period: "MONTHLY" },
  PA: { plan: "PRO", period: "ANNUAL" },
  AM: { plan: "AGENCY", period: "MONTHLY" },
  AA: { plan: "AGENCY", period: "ANNUAL" },
};

// New paying subscribers per month, oldest first: the 11 months before the anchor month.
// Worked out so that monthly recurring revenue (annual price ÷ 12) at each month end is:
//   1210, 1480, 1795, 2050, 2390, 2610, 2980, 3240, 3560, 3910, 4527
// The first row also holds everyone who joined before that month.
// (The design's last-but-one month says $4,525; no mix of plans matching the other
// numbers on the screens gives exactly that, so it lands on $4,527.)
//               [Pro monthly, Pro annual, Agency monthly, Agency annual]
const COHORTS: [number, number, number, number][] = [
  [24, 12, 9, 3], // 11 months ago (and earlier)
  [7, 3, 1, 1],
  [3, 7, 3, 0],
  [4, 0, 2, 2],
  [9, 5, 1, 1],
  [3, 1, 3, 0], // 6 months ago
  [5, 5, 4, 0], // 5 months ago: includes Kestrel Studio
  [9, 3, 0, 1],
  [1, 1, 5, 1], // 3 months ago: one Agency monthly cancels this month
  [10, 7, 1, 0], // 2 months ago: one Pro monthly and one Pro annual cancel this month
  [12, 7, 4, 2], // last month: includes Mbira Works
];

const WORDS_A = [
  "Amber", "Baobab", "Birch", "Blue Crane", "Bright", "Cedar", "Cobalt", "Copper", "Coral", "Delta",
  "Ember", "Fern", "Fig", "Flint", "Harbour", "Hazel", "Indigo", "Ivy", "Jacaranda", "Juniper",
  "Kudu", "Lantern", "Linen", "Lumen", "Maple", "Marula", "Meadow", "Msasa", "North Star", "Ochre",
  "Olive", "Onyx", "Pebble", "Pine", "Quill", "Rooibos", "Saffron", "Savanna", "Slate", "Tamarind",
];
const WORDS_B = [
  "Studio", "Creative", "Digital", "Design", "Labs", "Works", "Media", "Collective", "& Co", "Agency",
  "Interactive", "Web", "Partners", "Films", "House", "Print", "Brands", "Pixel", "Consulting", "Workshop",
  "Studios", "Craft", "Lab", "Ideas",
];
const FIRST = [
  "Tariro", "Kuda", "Nyasha", "Rumbi", "Tatenda", "Chipo", "Simba", "Rufaro", "Thabo", "Lerato",
  "Ayo", "Zola", "Neo", "Kagiso", "Amara", "Sipho", "Naledi", "Tendai", "Wanjiru", "Kwame",
  "Lindiwe", "Musa", "Farai", "Nomsa", "Kofi", "Priya", "Sarah", "Ana", "Daniel", "Grace",
];
const SURNAME_INITIALS = "ABCDEFGHJKLMNPRSTVWZ";

// Names used by the rows shown on the Subscribers screen. Generated names avoid them.
const RESERVED = new Set([
  "Northfold Studio", "Kraal Digital", "Two Cups Creative", "Mbira Works", "Oakline Labs",
  "Sable & Co", "Baobab Films", "Riverbend Design", "Kestrel Studio", "Granite Web",
]);

function makeNamer() {
  let i = 0;
  return () => {
    for (;;) {
      const a = WORDS_A[i % WORDS_A.length];
      const b = WORDS_B[Math.floor(i / WORDS_A.length) % WORDS_B.length];
      const owner = `${FIRST[(i * 7) % FIRST.length]} ${SURNAME_INITIALS[(i * 3) % SURNAME_INITIALS.length]}.`;
      i++;
      const name = `${a} ${b}`;
      if (!RESERVED.has(name)) return { name, owner };
    }
  };
}

/** Small deterministic PRNG so member counts are the same on every run. */
function makeRandom(seed: number) {
  let s = seed;
  return (min: number, max: number) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return min + (s % (max - min + 1));
  };
}

async function seedSubscriptions(tx: Prisma.TransactionClient) {
  const nextName = makeNamer();
  const random = makeRandom(42);
  const rows: Prisma.SubscriptionCreateManyInput[] = [];
  let orgCounter = 0;

  function row(
    kind: Kind,
    startedAt: Date,
    extra: Partial<Prisma.SubscriptionCreateManyInput> = {},
  ): Prisma.SubscriptionCreateManyInput {
    const { plan, period } = KIND[kind];
    const generated = extra.workspaceName ? null : nextName();
    return {
      orgId: `demo_org_${++orgCounter}`,
      plan,
      period,
      amount: PRICE[plan as "PRO" | "AGENCY"][period],
      status: "ACTIVE",
      startedAt,
      workspaceName: generated?.name ?? "",
      ownerName: generated?.owner,
      memberCount: plan === "AGENCY" ? random(5, 24) : random(1, 12),
      isDemo: true,
      ...extra,
    };
  }

  // --- History: the 11 months before the anchor month ---
  COHORTS.forEach((counts, index) => {
    const monthsAgo = COHORTS.length - index; // 11 .. 1
    (["PM", "PA", "AM", "AA"] as Kind[]).forEach((kind, k) => {
      for (let n = 0; n < counts[k]; n++) {
        // The first cohort also stands for everyone who joined earlier: spread it over the year before.
        const extraMonths = index === 0 ? n % 12 : 0;
        const dom = 1 + ((n * 5 + k * 3 + index) % 27); // days 1..27
        const startedAt = monthDay(monthsAgo + extraMonths, dom, `${pad(9 + ((n + k) % 8))}:${pad((n * 13) % 60)}`);
        rows.push(row(kind, startedAt));
      }
    });
  });

  /** Index of the first active history row of this kind that started `monthsAgo` months before the anchor. */
  function findHistoryRow(kind: Kind, monthsAgo: number): number {
    const idx = rows.findIndex(
      (r) =>
        r.status === "ACTIVE" &&
        r.plan === KIND[kind].plan &&
        r.period === KIND[kind].period &&
        sameMonth(r.startedAt as Date, monthDay(monthsAgo, 1)),
    );
    if (idx < 0) throw new Error(`No ${kind} subscriber ${monthsAgo} months ago to use.`);
    return idx;
  }

  function cancel(idx: number, endedAt: Date) {
    rows[idx] = { ...rows[idx], status: "CANCELLED", endedAt };
  }

  // Named history rows from the Subscribers screen (both cancel this month).
  const kestrel = findHistoryRow("PM", 5);
  rows[kestrel] = { ...rows[kestrel], startedAt: monthDay(5, 3, "11:20"), workspaceName: "Kestrel Studio", ownerName: "Musa T.", memberCount: 5 };
  const mbira = findHistoryRow("PM", 1);
  rows[mbira] = { ...rows[mbira], startedAt: monthDay(1, 2, "14:05"), workspaceName: "Mbira Works", ownerName: "Tendai K.", memberCount: 2 };
  // The three other cancellations this month: 1 Agency monthly, 1 Pro monthly, 1 Pro annual.
  const otherCancellations = [findHistoryRow("AM", 3), findHistoryRow("PM", 2), findHistoryRow("PA", 2)];

  // --- The anchor month, oldest event first ---
  // 22 new subscribers (8 annual) and 5 cancellations. Northfold's real upgrade makes it 23 new.
  // Offsets are days before the anchor as in the design (anchor 24 Nov: -23 = 1 Nov).
  const startOfAnchorMonth = monthDay(0, 1, "08:00");
  const events: Date[] = [];
  const at = (offset: number, time: string) => inAnchorMonth(offset, time, startOfAnchorMonth, events);

  const earlyNew: Kind[] = ["PM", "PA", "PM", "PM", "PA", "PM", "PM", "PA", "PM", "PM", "PA", "PM", "PM", "PA", "PM"];
  earlyNew.forEach((kind, i) => {
    rows.push(row(kind, at(-23 + Math.floor(i / 3), `${pad(10 + (i % 3) * 2)}:15`)));
  });
  otherCancellations.forEach((idx, i) => cancel(idx, at(-19, `${16 + i}:00`)));

  const addNamed = (kind: Kind, offset: number, time: string, name: string, owner: string, members: number) =>
    rows.push(row(kind, at(offset, time), { workspaceName: name, ownerName: owner, memberCount: members }));

  addNamed("PA", -18, "10:40", "Granite Web", "Ana R.", 7);
  cancel(kestrel, at(-16, "10:30"));
  addNamed("PM", -13, "12:10", "Riverbend Design", "Sarah P.", 2);
  addNamed("AM", -10, "09:25", "Baobab Films", "Kofi A.", 9);
  addNamed("PA", -7, "15:05", "Sable & Co", "Lindiwe N.", 6);
  addNamed("AA", -4, "11:50", "Oakline Labs", "Priya S.", 18);
  cancel(mbira, at(-3, "16:45"));
  addNamed("PM", -2, "13:30", "Two Cups Creative", "Farai C.", 3);
  addNamed("AM", -1, "10:05", "Kraal Digital", "Nomsa D.", 11);

  // --- 640 free workspaces, joined over the last two years ---
  for (let i = 0; i < 640; i++) {
    const { name, owner } = nextName();
    rows.push({
      orgId: `demo_org_${++orgCounter}`,
      plan: "FREE",
      period: null,
      amount: 0,
      status: "ACTIVE",
      startedAt: monthDay(1 + (i % 24), 1 + ((i * 11) % 27), `${pad(8 + (i % 10))}:${pad((i * 7) % 60)}`),
      workspaceName: name,
      ownerName: owner,
      memberCount: random(1, 4),
      isDemo: true,
    });
  }

  await tx.subscription.createMany({ data: rows });
}

function sameMonth(a: Date, b: Date): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" });
  return fmt.format(a) === fmt.format(b);
}

/**
 * A date in the anchor month at the design's day offset. If the offset falls before the 1st
 * (early in a month), it is clamped to the 1st, one minute after the previous clamped event,
 * so the newest-first order on the screens is kept.
 */
function inAnchorMonth(offset: number, time: string, monthStart: Date, events: Date[]): Date {
  let date = day(offset, time);
  const last = events.at(-1);
  if (date < monthStart) date = monthStart;
  if (last && date <= last) date = new Date(last.getTime() + 60_000);
  events.push(date);
  return date;
}

// ---------- Team notes (Clerk) ----------

async function seedTeamNotes() {
  for (const [userId, note] of TEAM_NOTES) {
    await clerk.organizations.updateOrganizationMembershipMetadata({
      organizationId: ORG,
      userId,
      publicMetadata: { note },
    });
  }
}

// ---------- Demo reset in Clerk ----------

const WORKSPACE_NAME = "Northfold Studio";
// The demo starts on Free, so it gets Free's team member limit.
const MEMBER_LIMIT = PLANS.free.limits.members;

/**
 * Undoes what visitors can do to the public demo workspace in Clerk. Runs before the database
 * reset, because the ClientInvite rows are how it finds the invitations and accounts to remove.
 * Never touches the DEMO_* people or ADMIN_USER_IDS. An invited client account is deleted only
 * if it was created after its invite (made through it); an older account just loses access.
 */
async function resetDemoClerk() {
  const protectedIds = new Set(
    [TINO, LEO, AMA, JEN, THANDI, ADMIN, ...(process.env.ADMIN_USER_IDS ?? "").split(",")]
      .map((id) => id?.trim())
      .filter((id): id is string => Boolean(id)),
  );
  const demoTeam = new Set([TINO, LEO, AMA, JEN]);

  // 1. Client invitations made in the demo workspace, and the accounts made through them.
  const invites = await db.clientInvite.findMany({
    where: { orgId: ORG },
    select: { invitationId: true, claimedByUserId: true, createdAt: true },
  });
  let revoked = 0;
  let deleted = 0;
  for (const invite of invites) {
    // Claimed invites can still be pending in Clerk (claimed by email, link never opened).
    await clerk.invitations.revokeInvitation(invite.invitationId).then(
      () => (revoked += 1),
      () => {}, // already accepted, revoked or expired
    );
    const userId = invite.claimedByUserId;
    if (!userId || protectedIds.has(userId)) continue;
    const user = await clerk.users.getUser(userId).catch(() => null);
    if (user && user.createdAt >= invite.createdAt.getTime() - 60_000) {
      await clerk.users.deleteUser(userId);
      deleted += 1;
    }
  }

  // 2. Team invitations waiting in the demo workspace.
  const pending = await clerk.organizations.getOrganizationInvitationList({
    organizationId: ORG,
    status: ["pending"],
    limit: 500,
  });
  for (const invitation of pending.data) {
    await clerk.organizations.revokeOrganizationInvitation({
      organizationId: ORG,
      invitationId: invitation.id,
      requestingUserId: TINO,
    });
  }

  // 3. Anyone who joined the demo team besides the four demo people.
  const memberships = await clerk.organizations.getOrganizationMembershipList({ organizationId: ORG, limit: 500 });
  let removed = 0;
  for (const m of memberships.data) {
    const userId = m.publicUserData?.userId;
    if (userId && !demoTeam.has(userId)) {
      await clerk.organizations.deleteOrganizationMembership({ organizationId: ORG, userId });
      removed += 1;
    }
  }

  // 4. The workspace name (Owners can rename it) and its member limit.
  await clerk.organizations.updateOrganization(ORG, { name: WORKSPACE_NAME, maxAllowedMemberships: MEMBER_LIMIT });

  console.log(
    `Clerk reset: ${revoked + pending.data.length} invitations revoked, ${deleted} invited accounts deleted, ${removed} extra members removed.`,
  );
}

// ---------- Run ----------

export type DemoResetReport = {
  anchor: string;
  paidPlansEnded: number;
  filesDeleted: number;
  projects: number;
  tasks: number;
  comments: number;
  deliverables: number;
  activity: number;
  demoSubscriptions: number;
};

/** The full demo reset: Clerk billing, Blob files, Clerk people, then the database. */
export async function runDemoReset(database: PrismaClient): Promise<DemoResetReport> {
  init(database);
  const anchor = `${ANCHOR.y}-${pad(ANCHOR.m)}-${pad(ANCHOR.d)}`;
  console.log(`Seeding demo data with anchor date ${anchor}${process.env.DEMO_ANCHOR_DATE?.trim() ? "" : " (today)"}...`);

  const paidPlansEnded = await resetDemoBilling(db);
  console.log(`Billing reset: ${paidPlansEnded} paid plans ended, Northfold is on Free.`);
  const filesDeleted = await resetDemoFiles();
  console.log(`Blob reset: ${filesDeleted} files deleted.`);

  await resetDemoClerk();
  await db.$transaction(
    async (tx) => {
      await reset(tx);
      await seedAgency(tx);
      await seedSubscriptions(tx);
    },
    { timeout: 120_000, maxWait: 20_000 },
  );
  await seedTeamNotes();

  const [projects, tasks, comments, deliverables, activity, demoSubscriptions] = await Promise.all([
    db.project.count({ where: { orgId: ORG } }),
    db.task.count({ where: { project: { orgId: ORG } } }),
    db.comment.count({ where: { task: { project: { orgId: ORG } } } }),
    db.deliverable.count({ where: { milestone: { project: { orgId: ORG } } } }),
    db.activity.count({ where: { orgId: ORG } }),
    db.subscription.count({ where: { isDemo: true } }),
  ]);
  console.log(
    `Done: ${projects} projects, ${tasks} tasks, ${comments} comments, ${deliverables} deliverables, ${activity} activity lines, ${demoSubscriptions} demo subscriptions, ${TEAM_NOTES.length} team notes.`,
  );
  return { anchor, paidPlansEnded, filesDeleted, projects, tasks, comments, deliverables, activity, demoSubscriptions };
}
