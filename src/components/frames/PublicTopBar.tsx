"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#portal", label: "Client portal" },
];

/** Public top bar. Hidden on Sign in / Sign up, which share the window but have no top bar. */
export function PublicTopBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null;

  return (
    <header className="flex flex-wrap items-center gap-4 rounded-panel bg-panel px-[14px] py-[10px]">
      <Link href="/" className="flex items-center gap-[10px] text-ink hover:text-ink">
        <span className="flex size-9 items-center justify-center rounded-[11px] bg-violet-icon text-[13px] font-bold text-white">
          So
        </span>
        <span className="text-lg font-bold tracking-[-0.01em]">SIGNoFF</span>
      </Link>
      <nav aria-label="Site" className="flex flex-1 flex-wrap justify-center gap-1 phone:hidden">
        {links.map((link) => {
          const selected = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={selected ? "page" : undefined}
              className={cx(
                "rounded-control px-[14px] py-2 text-sm",
                selected ? "bg-card font-medium text-ink shadow-tab hover:text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-4 phone:ml-auto">
        <Link href="/sign-in" className="rounded-control px-[14px] py-[9px] text-sm font-medium text-ink hover:text-ink">
          Sign in
        </Link>
        <Button href="/sign-in" size="bar">
          Try the demo
        </Button>
      </div>
    </header>
  );
}
