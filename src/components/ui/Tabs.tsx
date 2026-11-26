import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";

export type TabItem = {
  key: string;
  label: ReactNode;
  selected: boolean;
  /** Real page link (project tabs). Without it the tab is a button that calls `onSelect`. */
  href?: string;
  count?: number | string;
  /** Small square icon before the label (project tabs). */
  square?: boolean;
  /** Extra content after the label (e.g. the "2 months free" tag). */
  extra?: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  label: string;
  /** underline = 2 px violet underline row; switch = grey pill group with a white selected segment. */
  variant?: "underline" | "switch";
  /** Switch padding: sm = 7×12 at 13 px (admin filters), md = 9×16 at 14 px (pricing). */
  size?: "sm" | "md";
  onSelect?: (key: string) => void;
  /** Content at the far right of an underline row (e.g. "Filter"). */
  end?: ReactNode;
  className?: string;
};

export function Tabs({ items, label, variant = "underline", size = "sm", onSelect, end, className }: TabsProps) {
  if (variant === "switch") {
    return (
      <div role="group" aria-label={label} className={cx("flex gap-1 rounded-card bg-panel p-1", className)}>
        {items.map((item) => (
          <TabControl
            key={item.key}
            item={item}
            onSelect={onSelect}
            role="switch"
            className={cx(
              "flex shrink-0 items-center whitespace-nowrap rounded-switch font-medium",
              size === "sm" ? "gap-1.5 px-3 py-[7px] text-[13px]" : "gap-2 px-4 py-[9px] text-sm",
              item.selected ? "bg-card text-ink shadow-switch" : "text-muted",
            )}
          >
            {item.label}
            {item.count !== undefined && <span className="text-[11px] text-muted">{item.count}</span>}
            {item.extra}
          </TabControl>
        ))}
      </div>
    );
  }

  return (
    <div role="tablist" aria-label={label} className={cx("flex flex-wrap items-center gap-1 border-b border-panel", className)}>
      {items.map((item) => (
        <TabControl
          key={item.key}
          item={item}
          onSelect={onSelect}
          role="tab"
          className={cx(
            "-mb-px flex items-center gap-2 border-b-2 px-[14px] py-3 text-sm",
            item.selected ? "border-violet font-semibold text-ink" : "border-transparent font-medium text-muted",
          )}
        >
          {item.square && (
            <span
              className={cx(
                "size-4 rounded-[4px] border-[1.6px]",
                item.selected ? "border-violet" : "border-faint",
              )}
            />
          )}
          {item.label}
          {item.count !== undefined && (
            <span className="rounded-full bg-soft-2 px-[7px] py-0.5 text-[11px] font-semibold text-ink-3">{item.count}</span>
          )}
          {item.extra}
        </TabControl>
      ))}
      {end && (
        <>
          <div className="flex-1" />
          {end}
        </>
      )}
    </div>
  );
}

function TabControl({
  item,
  onSelect,
  role,
  className,
  children,
}: {
  item: TabItem;
  onSelect?: (key: string) => void;
  role: "tab" | "switch";
  className: string;
  children: ReactNode;
}) {
  if (item.href) {
    return (
      <Link
        href={item.href}
        role={role === "tab" ? "tab" : undefined}
        aria-selected={role === "tab" ? item.selected : undefined}
        aria-current={item.selected ? "page" : undefined}
        className={className}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role={role === "tab" ? "tab" : undefined}
      aria-selected={role === "tab" ? item.selected : undefined}
      aria-pressed={role === "switch" ? item.selected : undefined}
      onClick={() => onSelect?.(item.key)}
      className={className}
    >
      {children}
    </button>
  );
}
