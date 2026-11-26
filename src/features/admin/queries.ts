import { cache } from "react";
import type { SquareTone } from "@/components/ui/CompanySquare";
import { db } from "@/lib/db";
import { dollars, dollarsCents, money, monthLong, monthShort, nameInitials, percent1, shortDateYear, toDateInput } from "@/lib/format";
import type { SubscriberFilter } from "./schemas";

// The admin numbers, all from the Subscription table: seeded demo history (isDemo) plus the rows
// the Clerk webhook writes for real upgrades (features/billing/sync.ts). Used by the Admin
// dashboard, the Subscribers screen, the admin side panel and the CSV export.
//
// Rules:
// - Paying = ACTIVE Pro and Agency subscriptions. FREE rows only count as "Free workspaces".
// - A subscription's monthly value is its monthly price, or its annual price ÷ 12 rounded to
//   the cent ($189.96 → $15.83), the same value the tables show.
// - Monthly revenue for a month = the sum of monthly values of subscriptions active at that
//   month's end (for the current month: now). Months are calendar months in studio time.
// - "New" = started this month; "Cancellations" = ended this month, as a % of last month's paying.
// - Newest first = by the latest of startedAt and endedAt.

const STUDIO_OFFSET = "+02:00"; // Africa/Harare, no daylight saving (as in lib/format.ts)

const PAGE_SIZE = 10;

type PaidRow = Awaited<ReturnType<typeof readPaidRows>>[number];

function readPaidRows() {
  return db.subscription.findMany({
    where: { plan: { not: "FREE" } },
    select: {
      id: true,
      orgId: true,
      plan: true,
      period: true,
      amount: true,
      status: true,
      startedAt: true,
      endedAt: true,
      workspaceName: true,
      ownerName: true,
      memberCount: true,
      createdAt: true,
    },
  });
}

/** One read per request, shared by the page and the side panel. */
const loadAdminRows = cache(async () => {
  const [paid, free] = await Promise.all([
    readPaidRows(),
    db.subscription.count({ where: { plan: "FREE", status: "ACTIVE" } }),
  ]);
  return { paid, free };
});

// ---------- Small rules ----------

/** Monthly value in cents: the monthly price, or the annual price ÷ 12 rounded to the cent. */
function monthlyCents(row: Pick<PaidRow, "period" | "amount">): number {
  return row.period === "ANNUAL" ? Math.round(row.amount / 12) : row.amount;
}

function isActiveAt(row: PaidRow, t: Date): boolean {
  return row.startedAt <= t && (!row.endedAt || row.endedAt > t);
}

function newestAt(row: PaidRow): number {
  return Math.max(row.startedAt.getTime(), row.endedAt?.getTime() ?? 0);
}

function byNewest(a: PaidRow, b: PaidRow): number {
  return newestAt(b) - newestAt(a) || b.createdAt.getTime() - a.createdAt.getTime();
}

/** Midnight on the 1st of a month in studio time; `monthIndex` may overflow either way. */
function monthStart(year: number, monthIndex: number): Date {
  const d = new Date(Date.UTC(year, monthIndex, 1));
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return new Date(`${ym}-01T00:00:00${STUDIO_OFFSET}`);
}

function currentMonth(now: Date) {
  const [y, m] = toDateInput(now).split("-").map(Number);
  return { y, mi: m - 1 };
}

function sumCents(rows: PaidRow[]): number {
  return rows.reduce((total, r) => total + monthlyCents(r), 0);
}

// ---------- Display rows (both tables and the CSV) ----------

const SQUARE_TONES: SquareTone[] = ["workspace", "blue", "green", "violet", "peach"];

const PLAN_NAME = { PRO: "Pro", AGENCY: "Agency" } as const;

export type SubscriberRow = {
  id: string;
  initials: string;
  tone: SquareTone;
  workspace: string;
  owner: string;
  plan: string;
  billing: string;
  members: number;
  active: boolean;
  started: string;
  value: string;
  highlight: boolean;
};

function planName(row: PaidRow): string {
  return row.plan === "AGENCY" ? PLAN_NAME.AGENCY : PLAN_NAME.PRO;
}

function periodName(row: PaidRow): string {
  return row.period === "ANNUAL" ? "Annual" : "Monthly";
}

function toSubscriberRow(row: PaidRow, index: number, now: Date): SubscriberRow {
  const active = row.status === "ACTIVE";
  const ageMs = now.getTime() - row.startedAt.getTime();
  return {
    id: row.id,
    initials: nameInitials(row.workspaceName || "?"),
    tone: SQUARE_TONES[index % SQUARE_TONES.length],
    workspace: row.workspaceName || "Unnamed workspace",
    owner: row.ownerName ?? "—",
    plan: planName(row),
    billing: `${periodName(row)} · ${money(row.amount / 100)}`,
    members: row.memberCount,
    active,
    started: ageMs >= 0 && ageMs < 60 * 60 * 1000 ? "Just now" : shortDateYear(row.startedAt, now),
    value: dollarsCents(active ? monthlyCents(row) : 0),
    highlight: Boolean(process.env.DEMO_ORG_ID) && row.orgId === process.env.DEMO_ORG_ID,
  };
}

// ---------- Side panel ----------

/** Paying subscribers, and all workspaces (paying + free). */
export async function getAdminSidebarCounts() {
  const { paid, free } = await loadAdminRows();
  const paying = paid.filter((r) => r.status === "ACTIVE").length;
  return { paying, workspaces: paying + free };
}

// ---------- Admin dashboard ----------

export type RevenueMonth = { key: string; short: string; full: string; cents: number; prevCents: number | null };

type Chip = { text: string; tone: "up" | "flat" };

export type AdminStat = { label: string; value: string; chip: Chip; note: string };

export type PlanSplitRow = { name: string; count: number; mrr: string; pct: number };

export async function getAdminOverview(now: Date) {
  const { paid, free } = await loadAdminRows();
  const { y, mi } = currentMonth(now);
  const thisMonth = monthStart(y, mi);
  const lastMonthEnd = new Date(thisMonth.getTime() - 1);

  // 13 months so the oldest bar shown also has "the month before"; the last 12 are shown.
  const raw = Array.from({ length: 13 }, (_, i) => {
    const monthsAgo = 12 - i;
    const start = monthStart(y, mi - monthsAgo);
    const at = monthsAgo === 0 ? now : new Date(monthStart(y, mi - monthsAgo + 1).getTime() - 1);
    const mid = new Date(start.getTime() + 15 * 24 * 60 * 60 * 1000);
    return {
      key: toDateInput(start).slice(0, 7),
      short: monthShort(mid),
      full: `${monthShort(mid)} ${toDateInput(mid).slice(0, 4)}`,
      cents: sumCents(paid.filter((r) => isActiveAt(r, at))),
    };
  });
  const months: RevenueMonth[] = raw.slice(1).map((m, i) => ({ ...m, prevCents: raw[i].cents }));

  const active = paid.filter((r) => r.status === "ACTIVE");
  const payingLastMonth = paid.filter((r) => isActiveAt(r, lastMonthEnd)).length;
  const mrr = sumCents(active);
  const lastMrr = raw[11].cents;
  const newRows = paid.filter((r) => r.startedAt >= thisMonth);
  const cancelled = paid.filter((r) => r.endedAt && r.endedAt >= thisMonth).length;
  const payingChange = active.length - payingLastMonth;
  const mrrChange = lastMrr > 0 ? (mrr - lastMrr) / lastMrr : null;

  const signed = (n: number, text: string) => (n > 0 ? `+${text}` : n < 0 ? `−${text}` : text);
  const pct = (ratio: number) => percent1(Math.abs(ratio));

  const stats: AdminStat[] = [
    {
      label: "Monthly recurring revenue",
      value: dollars(mrr),
      chip: mrrChange === null ? { text: "New", tone: "flat" } : { text: signed(mrrChange, pct(mrrChange)), tone: mrrChange > 0 ? "up" : "flat" },
      note: `vs ${monthLong(lastMonthEnd)}`,
    },
    {
      label: "Paying subscribers",
      value: active.length.toLocaleString("en-US"),
      chip: { text: signed(payingChange, String(Math.abs(payingChange))), tone: payingChange > 0 ? "up" : "flat" },
      note: "this month",
    },
    {
      label: "New subscribers",
      value: newRows.length.toLocaleString("en-US"),
      chip: { text: monthShort(now), tone: "flat" },
      note: `${newRows.filter((r) => r.period === "ANNUAL").length} chose annual`,
    },
    {
      label: "Cancellations",
      value: cancelled.toLocaleString("en-US"),
      chip: { text: pct(payingLastMonth > 0 ? cancelled / payingLastMonth : 0), tone: "flat" },
      note: "of last month’s subscribers",
    },
  ];

  const groups = (
    [
      ["PRO", "MONTHLY", "Pro · monthly"],
      ["PRO", "ANNUAL", "Pro · annual"],
      ["AGENCY", "MONTHLY", "Agency · monthly"],
      ["AGENCY", "ANNUAL", "Agency · annual"],
    ] as const
  ).map(([plan, period, name]) => {
    const rows = active.filter((r) => r.plan === plan && r.period === period);
    return { name, count: rows.length, cents: sumCents(rows) };
  });
  const largest = Math.max(1, ...groups.map((g) => g.count));
  const plans: PlanSplitRow[] = groups.map((g) => ({
    name: g.name,
    count: g.count,
    mrr: dollars(g.cents),
    pct: Math.round((g.count / largest) * 100),
  }));

  const newest = [...paid].sort(byNewest).slice(0, 5).map((r, i) => toSubscriberRow(r, i, now));

  return { months, stats, plans, paying: active.length, free, newest };
}

// ---------- Subscribers ----------

function matchesFilter(row: PaidRow, filter: Pick<SubscriberFilter, "plan" | "status" | "q">): boolean {
  if (filter.plan === "pro" && row.plan !== "PRO") return false;
  if (filter.plan === "agency" && row.plan !== "AGENCY") return false;
  if (filter.status === "active" && row.status !== "ACTIVE") return false;
  if (filter.status === "cancelled" && row.status !== "CANCELLED") return false;
  const q = filter.q.trim().toLowerCase();
  if (q && !row.workspaceName.toLowerCase().includes(q) && !(row.ownerName ?? "").toLowerCase().includes(q)) {
    return false;
  }
  return true;
}

/**
 * The Subscribers table: filtered, newest first, 10 a page. Counts are for all subscribers.
 * "Cancelled" means every cancelled subscription, not only this month's.
 */
export async function listSubscribers(filter: SubscriberFilter, now: Date) {
  const { paid } = await loadAdminRows();
  const { y, mi } = currentMonth(now);
  const thisMonth = monthStart(y, mi);

  const matching = paid.filter((r) => matchesFilter(r, filter)).sort(byNewest);
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(filter.page, pageCount);
  const from = (page - 1) * PAGE_SIZE;
  const rows = matching.slice(from, from + PAGE_SIZE).map((r, i) => toSubscriberRow(r, i, now));

  const activeCount = paid.filter((r) => r.status === "ACTIVE").length;
  return {
    rows,
    page,
    pageCount,
    total: matching.length,
    from: matching.length === 0 ? 0 : from + 1,
    to: from + rows.length,
    counts: {
      all: paid.length,
      pro: paid.filter((r) => r.plan === "PRO").length,
      agency: paid.filter((r) => r.plan === "AGENCY").length,
      active: activeCount,
      cancelled: paid.length - activeCount,
    },
    paying: activeCount,
    cancelledThisMonth: paid.filter((r) => r.endedAt && r.endedAt >= thisMonth).length,
  };
}

// ---------- CSV export ----------

function csvCell(value: string | number): string {
  let text = String(value);
  // Stop spreadsheets from running a workspace name as a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Every subscriber matching the filters (no paging), newest first, as CSV. No email addresses. */
export async function subscribersCsv(filter: SubscriberFilter): Promise<string> {
  const { paid } = await loadAdminRows();
  const rows = paid.filter((r) => matchesFilter(r, filter)).sort(byNewest);
  const header = ["Workspace", "Owner", "Plan", "Billing", "Price", "Members", "Status", "Started", "Ended", "Monthly value"];
  const lines = rows.map((r) =>
    [
      r.workspaceName,
      r.ownerName ?? "",
      planName(r),
      periodName(r),
      (r.amount / 100).toFixed(2),
      r.memberCount,
      r.status === "ACTIVE" ? "Active" : "Cancelled",
      toDateInput(r.startedAt),
      r.endedAt ? toDateInput(r.endedAt) : "",
      (r.status === "ACTIVE" ? monthlyCents(r) / 100 : 0).toFixed(2),
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
