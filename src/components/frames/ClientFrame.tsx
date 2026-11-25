import { Suspense, type ReactNode } from "react";
import { FileIcon, HelpIcon, HomeIcon, KanbanIcon } from "@/components/icons";
import { AppRail } from "./AppRail";
import { AppShell } from "./AppShell";
import { ClientProjectsRailLink } from "./ClientProjectsRailLink";
import { ClientSidePanel } from "./ClientSidePanel";
import { RailLink } from "./RailLink";
import { SidePanel } from "./SidePanel";
import { SideSearch } from "./SideSearch";
import { SideSkeleton } from "./SideSkeleton";
import { UserMenuSlot } from "./UserMenuSlot";

/** Client portal frame: Home, Projects, Files; Help at the bottom. */
export function ClientFrame({ children }: { children: ReactNode }) {
  return (
    <AppShell
      rail={
        <AppRail
          label="Main"
          bottom={
            <>
              <RailLink href="#" icon={<HelpIcon />} ariaLabel="Help" hideOnPhone />
              <Suspense fallback={<span className="size-11" />}>
                <UserMenuSlot as="client" />
              </Suspense>
            </>
          }
        >
          <RailLink href="/portal" icon={<HomeIcon />} label="Home" match={["/portal"]} exact />
          <Suspense fallback={<RailLink href="/portal" icon={<KanbanIcon />} label="Projects" />}>
            <ClientProjectsRailLink />
          </Suspense>
          <RailLink href="#" icon={<FileIcon />} label="Files" />
        </AppRail>
      }
      side={
        <SidePanel>
          <SideSearch placeholder="Search…" />
          <Suspense fallback={<SideSkeleton />}>
            <ClientSidePanel />
          </Suspense>
        </SidePanel>
      }
    >
      {children}
    </AppShell>
  );
}
