import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The narrow icon menu: "So" logo (links to the Landing page), the main items, a spacer, then the bottom items
 * (Help, Settings, avatar menu). On phones it becomes a row; the logo and spacer hide.
 */
export function AppRail({ label, children, bottom }: { label: string; children: ReactNode; bottom: ReactNode }) {
  return (
    <nav
      aria-label={label}
      className="flex flex-[0_0_68px] flex-col items-center gap-1.5 py-[10px] phone:flex-auto phone:flex-row phone:justify-around phone:p-0"
    >
      <Link
        href="/"
        aria-label="SIGNoFF home page"
        className="mb-[18px] flex size-[38px] items-center justify-center rounded-card bg-violet-icon text-sm font-bold text-white hover:text-white phone:hidden"
      >
        So
      </Link>
      {children}
      <div className="flex-1 phone:hidden" />
      {bottom}
    </nav>
  );
}
