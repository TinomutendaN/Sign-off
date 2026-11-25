// Answers are checked against "Screen wording to update for Clerk" (AGENTS.md):
// plan changes happen in Clerk's subscription details, not a Stripe portal.
const FAQS = [
  {
    q: "Do my clients need to pay?",
    a: "No. Clients are invited for free and only see their own projects, files and approvals.",
  },
  {
    q: "What happens when I reach the Free limit?",
    a: "Your work stays safe. You just can’t start a third project until you upgrade or archive one.",
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Yes. Open your subscription details from Billing to change plan or switch between monthly and annual.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Your plan stays active until the end of the period you paid for, then moves to Free.",
  },
];

/** "Questions": the grey panel of FAQ cards at the bottom of Pricing. */
export function PricingFaq() {
  return (
    <section className="mx-auto mt-6 mb-8 flex w-full max-w-[1180px] flex-col gap-[10px] rounded-section bg-panel px-[10px] pt-3 pb-[10px]">
      <div className="px-[10px] pt-1.5 pb-1">
        <h2 className="m-0 text-lg font-medium">Questions</h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[10px] phone:grid-cols-1">
        {FAQS.map((faq) => (
          <div key={faq.q} className="flex flex-col gap-2 rounded-card bg-card p-[18px] shadow-card">
            <h3 className="m-0 text-[15px] font-semibold">{faq.q}</h3>
            <p className="m-0 text-sm leading-[1.55] text-muted">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
