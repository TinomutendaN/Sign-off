"use client";

import { usePaymentMethods } from "@clerk/nextjs/experimental";
import { CardIcon } from "@/components/icons";
import { Card } from "@/components/ui/Card";
import { cardLine, cardNote } from "../cards";

/** Billing's "Payment method": the workspace's card from Clerk, or "No card on file". */
export function PaymentMethodCard() {
  const { data, isLoading } = usePaymentMethods({ for: "organization" });
  const card = data?.find((m) => m.isDefault) ?? data?.[0] ?? null;

  return (
    <Card className="flex items-center gap-[14px] p-[18px]">
      <span className="flex h-[34px] w-12 shrink-0 items-center justify-center rounded-[7px] bg-soft text-muted">
        <CardIcon size={22} />
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{isLoading ? "Loading…" : card ? cardLine(card) : "No card on file"}</span>
        <span className="text-xs text-muted">{isLoading ? " " : card ? cardNote(card) : "Added when you upgrade"}</span>
      </div>
    </Card>
  );
}
