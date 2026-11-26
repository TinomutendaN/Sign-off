import type { ReactNode } from "react";
import { AppWindow } from "./AppWindow";

/**
 * Agency, client and admin frame: one grey rounded frame holding the icon menu and the
 * white side panel, then the page. On laptop and tablet only the page area scrolls; on phones
 * the grey frame floats at the bottom as a tab bar and the whole page scrolls.
 */
export function AppShell({ rail, side, children }: { rail: ReactNode; side: ReactNode; children: ReactNode }) {
  return (
    <AppWindow layout="app">
      <div className="flex min-h-0 flex-[0_0_auto] gap-1 rounded-panel bg-panel py-2 pr-2 pl-1 phone:fixed phone:inset-x-2 phone:bottom-2 phone:z-30 phone:rounded-column phone:p-1.5 phone:shadow-dock">
        {rail}
        {side}
      </div>
      <main className="scroll-y flex min-h-0 min-w-0 flex-[999_1_560px] flex-col gap-[18px] overflow-y-auto px-5 pt-[18px] pb-[14px] phone:overflow-visible phone:px-1 phone:py-3 phone:[&_h1]:text-[22px]">
        {children}
      </main>
    </AppWindow>
  );
}
