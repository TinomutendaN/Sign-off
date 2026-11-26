"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon, WarningIcon } from "@/components/icons";
import { resetDemoPlan } from "../actions";

type BillingNoticeProps =
  | { kind: "limit" }
  | { kind: "paid"; planName: string; demo: boolean };

/** The strip under Billing's header: amber when Free's projects are used up, green once paid. */
export function BillingNotice(props: BillingNoticeProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (props.kind === "limit") {
    return (
      <div role="status" className="flex flex-wrap items-center gap-3 rounded-side bg-amber-tint px-4 py-3 text-sm text-amber-ink">
        <WarningIcon size={18} />
        <span className="flex-[1_1_300px]">
          <span className="font-semibold">You&apos;ve used both Free projects.</span> Upgrade to start a third project.
        </span>
      </div>
    );
  }

  function reset() {
    setError(null);
    startTransition(async () => {
      const result = await resetDemoPlan();
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-side bg-green-tint px-4 py-3 text-sm text-green-ink">
      <CheckIcon size={18} />
      <span className="flex-[1_1_300px]">
        <span className="font-semibold">You&apos;re on {props.planName}.</span> Payment received through Stripe. Your
        receipt is below.
      </span>
      <Link href="/projects" className="rounded-switch bg-card px-3 py-[7px] text-[13px] font-semibold text-green-ink hover:text-green-ink">
        Go to your projects
      </Link>
      {props.demo && (
        <button type="button" onClick={reset} disabled={pending} className="text-xs text-green-ink underline disabled:opacity-60">
          {pending ? "Resetting…" : "Reset demo"}
        </button>
      )}
      {error && <span className="w-full text-xs text-red-ink">{error}</span>}
    </div>
  );
}
