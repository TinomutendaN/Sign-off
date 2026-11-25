"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { PLAN_ORDER, type Period } from "../plans";
import { PricingPlanCard } from "./PricingPlanCard";

/**
 * Pricing heading block plus the three plan cards. The Monthly / Annual switch (Annual by default)
 * updates every price, the "Billed…" line and where each plan button goes.
 */
export function PricingPlans() {
  const [period, setPeriod] = useState<Period>("annual");

  return (
    <>
      <section className="flex flex-col items-center gap-4 px-6 pt-12 pb-7 text-center phone:px-[10px] phone:pt-7">
        <span className="text-xs font-semibold tracking-[0.06em] text-violet-icon">PRICING</span>
        <h1 className="m-0 max-w-[720px] text-[44px] leading-[1.1] font-semibold tracking-[-0.02em] phone:text-[32px]">
          Simple plans for freelancers and small agencies
        </h1>
        <p className="m-0 max-w-[560px] text-base leading-[1.6] text-muted">
          Start free with your first client. Upgrade when you take on more projects. Your clients never pay.
        </p>
        <Tabs
          variant="switch"
          size="md"
          label="Billing period"
          className="mt-2 items-center"
          onSelect={(key) => setPeriod(key as Period)}
          items={[
            { key: "monthly", label: "Monthly", selected: period === "monthly" },
            {
              key: "annual",
              label: "Annual",
              selected: period === "annual",
              extra: (
                <span className="rounded-full bg-green-tint px-[7px] py-0.5 text-[11px] font-semibold text-green-ink">
                  2 months free
                </span>
              ),
            },
          ]}
        />
      </section>

      <section
        aria-label="Plans"
        className="mx-auto grid w-full max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[10px] rounded-section bg-panel p-[10px]"
      >
        {PLAN_ORDER.map((key) => (
          <PricingPlanCard key={key} planKey={key} period={period} />
        ))}
      </section>
    </>
  );
}
