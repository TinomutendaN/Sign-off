import { Suspense, type ReactNode } from "react";
import { BillingIcon, HelpIcon, HomeIcon, KanbanIcon, PeopleIcon, SettingsIcon } from "@/components/icons";
import { AgencySidePanel } from "./AgencySidePanel";
import { AppRail } from "./AppRail";
import { AppShell } from "./AppShell";
import { RailLink } from "./RailLink";
import { SidePanel } from "./SidePanel";
import { SideSearch } from "./SideSearch";
import { SideSkeleton } from "./SideSkeleton";
import { UserMenuSlot } from "./UserMenuSlot";

/** Agency frame: Home, Clients, Projects, Billing; Help and Settings at the bottom. */
export function AgencyFrame({ children }: { children: ReactNode }) {
  return (
    <AppShell
      rail={
        <AppRail
          label="Main"
          bottom={
            <>
              <RailLink href="#" icon={<HelpIcon />} ariaLabel="Help" hideOnPhone />
              <RailLink href="/settings" icon={<SettingsIcon />} ariaLabel="Settings" match={["/settings"]} />
              <Suspense fallback={<span className="size-11" />}>
                <UserMenuSlot />
              </Suspense>
            </>
          }
        >
          <RailLink href="/dashboard" icon={<HomeIcon />} label="Home" match={["/dashboard"]} />
          <RailLink href="/clients" icon={<PeopleIcon />} label="Clients" match={["/clients"]} />
          <RailLink href="/projects" icon={<KanbanIcon />} label="Projects" match={["/projects"]} />
          <RailLink href="/billing" icon={<BillingIcon />} label="Billing" match={["/billing"]} />
        </AppRail>
      }
      side={
        <SidePanel>
          <SideSearch placeholder="Search…" />
          <Suspense fallback={<SideSkeleton />}>
            <AgencySidePanel />
          </Suspense>
        </SidePanel>
      }
    >
      {children}
    </AppShell>
  );
}
