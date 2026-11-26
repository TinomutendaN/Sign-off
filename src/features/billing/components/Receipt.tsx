"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DownloadIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { longDate } from "@/lib/format";
import { cardLine } from "../cards";
import { paymentLine } from "../receipts";

type Payment = Awaited<ReturnType<ReturnType<typeof useClerk>["billing"]["getPaymentAttempt"]>>;

type ReceiptProps = { paymentId: string; orgId: string; workspaceName: string };

/** One payment from Clerk as a receipt, with "Print or save as PDF". Only the receipt prints. */
export function Receipt({ paymentId, orgId, workspaceName }: ReceiptProps) {
  const clerk = useClerk();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!clerk.loaded) return;
    let live = true;
    clerk.billing
      .getPaymentAttempt({ id: paymentId, orgId })
      .then((p) => live && setPayment(p))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [clerk.loaded, clerk.billing, paymentId, orgId]);

  if (failed) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm text-muted">
        This receipt couldn&apos;t be found.
        <Link href="/billing">Back to Billing</Link>
      </div>
    );
  }

  const amount = payment ? `${payment.amount.currencySymbol}${payment.amount.amountFormatted}` : "";
  const rows: [string, string][] = payment
    ? [
        ["Workspace", workspaceName],
        ["Date", longDate(payment.paidAt ?? payment.updatedAt)],
        ["Description", paymentLine(payment)],
        ["Paid with", payment.paymentMethod ? cardLine(payment.paymentMethod) : "Card"],
        ["Payment ID", payment.id],
      ]
    : [];

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/billing" className="text-[13px] font-medium">
          ← Back to Billing
        </Link>
        <Button variant="outline" icon={<DownloadIcon />} onClick={() => window.print()} disabled={!payment}>
          Print or save as PDF
        </Button>
      </div>

      <Card className="receipt mx-auto flex w-full max-w-[560px] flex-col gap-5 p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-[10px]">
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-violet-icon text-[13px] font-bold text-white">
              So
            </span>
            <span className="text-lg font-bold tracking-[-0.01em]">SIGNoFF</span>
          </span>
          <Pill tone="green" size="md">
            Paid
          </Pill>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[22px] font-semibold">Receipt</h1>
          <div className="text-[13px] text-muted">{payment ? "Thank you for your payment." : "Loading…"}</div>
        </div>
        <dl className="m-0 flex flex-col gap-0">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-t border-soft-2 py-3 text-[13px]">
              <dt className="text-muted">{label}</dt>
              <dd className="m-0 text-right font-medium break-all">{value}</dd>
            </div>
          ))}
          {payment && (
            <div className="flex justify-between gap-4 border-t border-soft-2 pt-4 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="m-0 font-semibold">{amount}</dd>
            </div>
          )}
        </dl>
        <p className="m-0 text-xs text-muted">Stripe test mode · no real money was taken.</p>
      </Card>
    </div>
  );
}
