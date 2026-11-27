import { connection } from "next/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/frames/PageSkeleton";
import { PeopleIcon } from "@/components/icons";
import { Pill } from "@/components/ui/Pill";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Tabs } from "@/components/ui/Tabs";
import { ExportCsvButton } from "@/features/admin/components/ExportCsvButton";
import { Pager } from "@/features/admin/components/Pager";
import { SubscriberSearch } from "@/features/admin/components/SubscriberSearch";
import { SubscriberTable } from "@/features/admin/components/SubscriberTable";
import { listSubscribers } from "@/features/admin/queries";
import { subscriberFilterSchema, type SubscriberFilter } from "@/features/admin/schemas";
import { requireAdmin } from "@/lib/auth";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The URL for these filters, leaving defaults out: /admin/subscribers?plan=pro&page=2 */
function hrefFor(filter: SubscriberFilter) {
  const query = new URLSearchParams();
  if (filter.plan !== "all") query.set("plan", filter.plan);
  if (filter.status !== "all") query.set("status", filter.status);
  if (filter.q) query.set("q", filter.q);
  if (filter.page > 1) query.set("page", String(filter.page));
  const qs = query.toString();
  return qs ? `/admin/subscribers?${qs}` : "/admin/subscribers";
}

// 14 Subscribers. Filters, search and page live in the URL; "Cancelled" means every cancelled
// subscription (not only this month's).
async function SubscribersPageContent({ searchParams }: PageProps<"/admin/subscribers">) {
  await requireAdmin();
  const params = await searchParams;
  const filter = subscriberFilterSchema.parse({
    plan: first(params.plan),
    status: first(params.status),
    q: first(params.q),
    page: first(params.page),
  });
  await connection(); // "now" is read per request, never prerendered
  const data = await listSubscribers(filter, new Date());
  const { counts } = data;

  const unfiltered = filter.plan === "all" && filter.status === "all" && !filter.q;
  const summary =
    data.total === 0
      ? "No subscribers to show"
      : unfiltered && data.page === 1
        ? `Showing the ${data.rows.length} newest of ${counts.all}`
        : `Showing ${data.from}–${data.to} of ${data.total}${unfiltered ? "" : " matching"}, newest first`;

  return (
    <>
      <ScreenHeader
        icon={<PeopleIcon size={22} />}
        title="Subscribers"
        afterTitle={<Pill tone="amber">Demo data</Pill>}
        subtitle={`${data.paying} paying · ${data.cancelledThisMonth} cancelled this month`}
      >
        <SubscriberSearch initial={filter.q} />
        <ExportCsvButton filter={{ plan: filter.plan, status: filter.status, q: filter.q }} />
      </ScreenHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          variant="switch"
          label="Plan"
          items={(
            [
              ["all", "All plans", counts.all],
              ["pro", "Pro", counts.pro],
              ["agency", "Agency", counts.agency],
            ] as const
          ).map(([key, label, count]) => ({
            key,
            label,
            count,
            selected: filter.plan === key,
            href: hrefFor({ ...filter, plan: key, page: 1 }),
          }))}
        />
        <Tabs
          variant="switch"
          label="Status"
          items={(
            [
              ["all", "Any status", counts.all],
              ["active", "Active", counts.active],
              ["cancelled", "Cancelled", counts.cancelled],
            ] as const
          ).map(([key, label, count]) => ({
            key,
            label,
            count,
            selected: filter.status === key,
            href: hrefFor({ ...filter, status: key, page: 1 }),
          }))}
        />
        <span className="flex-1" />
        <span className="text-xs text-muted">Counts are for all subscribers. The table shows the newest.</span>
      </div>

      <section aria-label="Subscribers" className="flex flex-col gap-[10px] rounded-column bg-panel p-[10px]">
        <SubscriberTable rows={data.rows} showMembers empty="No subscribers match these filters." />
        <Pager
          summary={summary}
          previous={data.page > 1 ? hrefFor({ ...filter, page: data.page - 1 }) : null}
          next={data.page < data.pageCount ? hrefFor({ ...filter, page: data.page + 1 }) : null}
        />
      </section>
    </>
  );
}

// The page streams in under its own boundary, so a click shows the skeleton straight away.
export default function SubscribersPage(props: Parameters<typeof SubscribersPageContent>[0]) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SubscribersPageContent {...props} />
    </Suspense>
  );
}
