// How a Clerk payment card is written on Billing and on receipts.

type CardLike = {
  cardType: string | null;
  last4: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
};

/** "Visa ending in 4242" */
export function cardLine(card: CardLike): string {
  const brand = card.cardType ? card.cardType[0].toUpperCase() + card.cardType.slice(1) : "Card";
  return card.last4 ? `${brand} ending in ${card.last4}` : brand;
}

/** "Stripe test card · Expires 12/28" (payments run on Clerk's test gateway). */
export function cardNote(card: CardLike): string {
  const expires =
    card.expiryMonth && card.expiryYear
      ? ` · Expires ${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}`
      : "";
  return `Stripe test card${expires}`;
}
