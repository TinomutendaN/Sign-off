"use client";

import { useState } from "react";
import { cx } from "@/components/ui/cx";
import { dollars, percent1 } from "@/lib/format";
import type { RevenueMonth } from "../queries";

const STEP = 200_000; // $2k in cents: one grid line

function readout(m: RevenueMonth): string {
  const base = `${m.full}: ${dollars(m.cents)} a month`;
  if (!m.prevCents) return base;
  const change = (m.cents - m.prevCents) / m.prevCents;
  if (change === 0) return `${base} · the same as the month before`;
  return `${base} · ${change > 0 ? "up" : "down"} ${percent1(Math.abs(change))} on the month before`;
}

/**
 * The monthly recurring revenue bars. With nothing selected every bar is violet and the
 * readout shows the latest month. Hovering, focusing (keyboard) or tapping a bar shows its value
 * and fades the other bars.
 */
export function RevenueChart({ months }: { months: RevenueMonth[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const shown = months[selected ?? months.length - 1];

  // $0–$6k as in the design; grows in $2k steps if revenue ever passes $6k.
  const top = Math.max(3 * STEP, Math.ceil(Math.max(...months.map((m) => m.cents)) / STEP) * STEP);
  const ticks = Array.from({ length: top / STEP + 1 }, (_, i) => top - i * STEP);

  return (
    <div className="flex flex-1 flex-col gap-[10px] rounded-card bg-card px-[18px] pt-[18px] pb-3 shadow-card">
      <div className="min-h-[22px] text-[13px] text-ink-2">{shown ? readout(shown) : "No revenue yet"}</div>
      <div className="relative flex h-[220px] gap-[10px]">
        <div className="flex w-11 flex-col justify-between pb-5 text-right text-[11px] text-muted" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t}>{t === 0 ? "$0" : `$${t / 100_000}k`}</span>
          ))}
        </div>
        <div className="relative flex flex-1 flex-col">
          <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className={cx("border-t", t === 0 ? "border-solid border-slot" : "border-dashed border-track")} />
            ))}
          </div>
          <div className="relative flex flex-1 items-end gap-0.5" role="group" aria-label="Monthly recurring revenue by month">
            {months.map((m, i) => (
              <button
                key={m.key}
                type="button"
                aria-label={`${m.full}: ${dollars(m.cents)} a month`}
                aria-pressed={selected === i}
                onMouseEnter={() => setSelected(i)}
                onMouseLeave={() => setSelected(null)}
                onFocus={() => setSelected(i)}
                onBlur={() => setSelected(null)}
                onClick={() => setSelected(i)}
                className="flex h-full flex-1 cursor-default items-end px-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                <span
                  className={cx(
                    "block w-full rounded-t-[4px] transition-colors",
                    selected === null || selected === i ? "bg-violet" : "bg-violet-line",
                  )}
                  style={{ height: `${(m.cents / top) * 100}%` }}
                />
              </button>
            ))}
          </div>
          <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
            {months.map((m) => (
              <span key={m.key} className="flex-1 text-center text-[11px] text-muted">
                {m.short}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
