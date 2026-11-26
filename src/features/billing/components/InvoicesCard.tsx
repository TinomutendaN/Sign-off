"use client";

import { usePaymentAttempts } from "@clerk/nextjs/experimental";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { longDate } from "@/lib/format";
import { paymentLine } from "../receipts";

/** Billing's "Invoices": the workspace's paid payments from Clerk, each with a printable receipt. */
export function InvoicesCard() {
  const { data, isLoading } = usePaymentAttempts({ for: "organization", pageSize: 24 });
  const paid = (data ?? []).filter((p) => p.status === "paid");

  if (isLoading || paid.length === 0) {
    return (
      <Card className="px-4 py-1">
        <div className="py-[22px] text-center text-[13px] text-muted">
          {isLoading ? "Loading invoices…" : "No invoices yet. They'll appear here after your first payment."}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto px-4 py-1">
      <table className="w-full min-w-[520px] border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="px-2 py-3 font-medium">Date</th>
            <th className="px-2 py-3 font-medium">Description</th>
            <th className="px-2 py-3 font-medium">Amount</th>
            <th className="px-2 py-3 font-medium">Status</th>
            <th className="px-2 py-3 text-right font-medium">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {paid.map((p) => (
            <tr key={p.id} className="border-t border-soft-2">
              <td className="px-2 py-3">{longDate(p.paidAt ?? p.updatedAt)}</td>
              <td className="px-2 py-3">{paymentLine(p)}</td>
              <td className="px-2 py-3 font-semibold">
                {p.amount.currencySymbol}
                {p.amount.amountFormatted}
              </td>
              <td className="px-2 py-3">
                <Pill tone="green" className="text-xs">
                  Paid
                </Pill>
              </td>
              <td className="px-2 py-3 text-right">
                <Link href={`/billing/receipts/${p.id}`} className="font-medium">
                  Download
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
