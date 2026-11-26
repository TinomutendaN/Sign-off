// Receipt wording shared by Billing's invoice table and the receipt page.

type PaymentLike = {
  subscriptionItem: { plan: { name: string }; planPeriod: "month" | "annual" } | null;
};

/** "Pro plan · annual" */
export function paymentLine(payment: PaymentLike): string {
  const item = payment.subscriptionItem;
  if (!item) return "SIGNoFF subscription";
  return `${item.plan.name} plan · ${item.planPeriod === "annual" ? "annual" : "monthly"}`;
}
