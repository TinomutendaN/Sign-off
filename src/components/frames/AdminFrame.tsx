import { Suspense, type ReactNode } from "react";
import { BillingIcon, ChartIcon, PeopleIcon, SettingsIcon } from "@/components/icons";
import { AdminSidePanel } from "./AdminSidePanel";
import { AppRail } from "./AppRail";
import { AppShell } from "./AppShell";
import { RailLink } from "./RailLink";
import { SideCard } from "./SideCard";
import { SideIdentity } from "./SideIdentity";
import { SideLink } from "./SideLink";
import { SidePanel } from "./SidePanel";
import { SideSearch } from "./SideSearch";
import { SideSection } from "./SideSection";
import { UserMenuSlot } from "./UserMenuSlot";

/** SIGNoFF admin frame: Overview, Users, Plans; Settings at the bottom. */
export function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <AppShell
      rail={
        <AppRail
          label="Admin"
          bottom={
            <>
              <RailLink href="#" icon={<SettingsIcon />} ariaLabel="Settings" />
              <Suspense fallback={<span className="size-11" />}>
                <UserMenuSlot />
              </Suspense>
            </>
          }
        >
          <RailLink href="/admin" icon={<ChartIcon />} label="Overview" match={["/admin"]} exact />
          <RailLink href="/admin/subscribers" icon={<PeopleIcon />} label="Users" match={["/admin/subscribers"]} />
          <RailLink href="#" icon={<BillingIcon />} label="Plans" />
        </AppRail>
      }
      side={
        <SidePanel>
          <SideSearch placeholder="Search workspaces…" />
          <div className="flex items-center gap-[10px] p-2">
            <SideIdentity initials="So" square="navy" title="SIGNoFF Admin" subtitle="Owner access" />
          </div>
          <Suspense fallback={<AdminLinksFallback />}>
            <AdminSidePanel />
          </Suspense>
          <div className="flex-1" />
          <SideCard className="gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber" />
              <span className="text-[13px] font-semibold text-ink">Stripe test mode</span>
            </div>
            <div className="text-xs leading-normal text-muted">
              Payments use Stripe&apos;s test cards. Past months are sample data.
            </div>
          </SideCard>
        </SidePanel>
      }
    >
      {children}
    </AppShell>
  );
}

function AdminLinksFallback() {
  return (
    <SideSection label="ADMIN">
      <SideLink href="/admin" dot="violet" title="Overview" />
      <SideLink href="/admin/subscribers" dot="green" title="Subscribers" />
      <SideLink href="#" dot="blue" title="Workspaces" />
      <SideLink href="#" dot="amber" title="Plans & prices" />
      <SideLink href="#" dot="idle" title="Payment events" />
    </SideSection>
  );
}
