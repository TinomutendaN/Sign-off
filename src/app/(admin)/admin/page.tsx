import Link from "next/link";
import { ChartIcon } from "@/components/icons";
import { Pill } from "@/components/ui/Pill";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Section } from "@/components/ui/Section";
import { Tabs } from "@/components/ui/Tabs";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { ExportCsvButton } from "@/features/admin/components/ExportCsvButton";
import { PlanSplit } from "@/features/admin/components/PlanSplit";
import { RevenueChart } from "@/features/admin/components/RevenueChart";
import { SubscriberTable } from "@/features/admin/components/SubscriberTable";
import { getAdminOverview } from "@/features/admin/queries";
import { rangeSchema } from "@/features/admin/schemas";
import { requireAdmin } from "@/lib/auth";
import { clockTime } from "@/lib/format";

const RANGES = [
  { key: "3", label: "3 months" },
  { key: "6", label: "6 months" },
  { key: "12", label: "12 months" },
] as const;

// 13 Admin dashboard. ?range=3|6|12 picks how many months the revenue chart shows.
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { range: rawRange } = await searchParams;
  const range = rangeSchema.parse(Array.isArray(rawRange) ? rawRange[0] : rawRange);
  const now = new Date();
  const data = await getAdminOverview(now);
  const months = data.months.slice(-Number(range));

  return (
    <>
      <ScreenHeader
        icon={<ChartIcon size={22} />}
        title="Admin dashboard"
        afterTitle={<Pill tone="amber">Demo data</Pill>}
        subtitle={`All workspaces · Updated ${clockTime(now)}`}
      >
        <Tabs
          variant="switch"
          label="Date range"
          items={RANGES.map((r) => ({
            key: r.key,
            label: r.label,
            selected: r.key === range,
            href: r.key === "12" ? "/admin" : `/admin?range=${r.key}`,
          }))}
        />
        <ExportCsvButton />
      </ScreenHeader>

      <section
        aria-label="Key numbers"
        className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px] rounded-column bg-panel p-[10px] tablet:grid-cols-2 phone:grid-cols-1"
      >
        {data.stats.map((s) => (
          <AdminStatCard key={s.label} stat={s} />
        ))}
      </section>

      <div className="flex flex-wrap items-stretch gap-[14px]">
        <Section
          title="Monthly recurring revenue"
          aside={<span className="text-xs text-muted">Last {range} months · hover a bar for its value</span>}
          className="flex-[999_1_480px]"
        >
          <RevenueChart key={range} months={months} />
        </Section>
        <Section
          title="Subscribers by plan"
          aside={<span className="text-xs text-muted">{data.paying} paying</span>}
          className="max-w-[380px] flex-[1_1_300px] tablet:max-w-none"
        >
          <PlanSplit plans={data.plans} free={data.free} />
        </Section>
      </div>

      <Section
        title="Newest subscribers"
        aside={
          <Link href="/admin/subscribers" className="text-[13px] font-medium">
            View all
          </Link>
        }
      >
        <SubscriberTable rows={data.newest} />
      </Section>
    </>
  );
}
