const STEPS = [
  {
    n: "1",
    title: "Set up your workspace",
    text: "Invite your team, add a client and split each project into milestones and tasks with owners and due dates.",
  },
  {
    n: "2",
    title: "Share the work",
    text: "Upload a deliverable to its milestone and send it to your client for approval in one click.",
  },
  {
    n: "3",
    title: "Get sign-off",
    text: "Your client approves or asks for changes with a comment. Every decision is saved on the project.",
  },
];

/** "How it works": the grey panel with three numbered step cards. The top bar's link scrolls here. */
export function HowItWorks() {
  return (
    <section
      id="how"
      className="mx-auto flex w-full max-w-[1180px] scroll-mt-6 flex-col gap-[10px] rounded-section bg-panel px-[10px] pt-3 pb-[10px]"
    >
      <div className="flex flex-col gap-1 px-3 pt-2 pb-1.5">
        <span className="text-xs font-semibold tracking-[0.06em] text-violet-ink">HOW IT WORKS</span>
        <h2 className="m-0 text-[26px] font-semibold tracking-[-0.02em]">From first task to final approval</h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[10px]">
        {STEPS.map((step) => (
          <div key={step.n} className="flex flex-col gap-[10px] rounded-side bg-card p-[22px] shadow-card">
            <span className="flex size-[34px] items-center justify-center rounded-control bg-violet-tint text-sm font-bold text-violet-ink">
              {step.n}
            </span>
            <h3 className="m-0 text-[17px] font-semibold">{step.title}</h3>
            <p className="m-0 text-sm leading-[1.6] text-muted">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
