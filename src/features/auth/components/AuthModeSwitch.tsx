import Link from "next/link";
import { cx } from "@/components/ui/cx";

type AuthModeSwitchProps = {
  mode: "signup" | "signin";
  /** The current query string ("?plan=pro&period=annual"), kept when switching. */
  query: string;
};

const tabs = [
  { mode: "signup", href: "/sign-up", label: "Create account" },
  { mode: "signin", href: "/sign-in", label: "Sign in" },
] as const;

/** Grey two-tab switch: "Create account" and "Sign in". Each tab is its own address. */
export function AuthModeSwitch({ mode, query }: AuthModeSwitchProps) {
  return (
    <nav aria-label="Sign in or create account" className="flex gap-1 rounded-card bg-panel p-1">
      {tabs.map((tab) => {
        const selected = tab.mode === mode;
        return (
          <Link
            key={tab.mode}
            href={`${tab.href}${query}`}
            aria-current={selected ? "page" : undefined}
            className={cx(
              "flex-1 rounded-switch px-3 py-[9px] text-center text-sm font-medium",
              selected ? "bg-card text-ink shadow-switch hover:text-ink" : "text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
