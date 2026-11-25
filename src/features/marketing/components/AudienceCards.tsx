import { CheckIcon } from "@/components/icons";

const SIDES = [
  {
    kicker: "FOR YOUR TEAM",
    title: "One place for the work",
    points: [
      "A workspace for your studio, with owner and team roles",
      "Kanban board and list view for every project",
      "Milestones that show what is done and what is next",
      "Team comments that clients never see",
      "A dashboard of what is due and who is waiting",
    ],
  },
  {
    kicker: "FOR YOUR CLIENTS",
    title: "A portal they will actually use",
    points: [
      "Only their own projects, nothing else",
      "Clear progress for each milestone",
      "Approve or request changes without email threads",
      "Free for clients, with no account to pay for",
    ],
  },
];

/** "For your team" and "For your clients". The top bar's "Client portal" link scrolls here. */
export function AudienceCards() {
  return (
    <section
      id="portal"
      className="mx-auto mt-6 grid w-full max-w-[1180px] scroll-mt-6 grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[10px] phone:grid-cols-1"
    >
      {SIDES.map((side) => (
        <div key={side.kicker} className="flex rounded-section bg-panel p-[10px]">
          <div className="flex flex-1 flex-col gap-3.5 rounded-side bg-card p-6 shadow-mini">
            <span className="text-xs font-semibold tracking-[0.06em] text-violet-ink">{side.kicker}</span>
            <h2 className="m-0 text-[22px] font-semibold tracking-[-0.01em]">{side.title}</h2>
            <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
              {side.points.map((point) => (
                <li key={point} className="flex gap-[10px] text-sm leading-normal text-ink-2">
                  <CheckIcon className="mt-px shrink-0 text-violet" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </section>
  );
}
