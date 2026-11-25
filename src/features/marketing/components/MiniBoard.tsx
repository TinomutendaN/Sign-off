import { cx } from "@/components/ui/cx";

type MiniCard = { title: string; tag: string; avatar: string };

// A static picture of a board (not real data), copied from the Landing design.
const COLUMNS: { title: string; cards: MiniCard[] }[] = [
  {
    title: "In progress",
    cards: [
      { title: "Build menu page", tag: "bg-blue", avatar: "bg-av-tm" },
      { title: "Fix mobile images", tag: "bg-red", avatar: "bg-av-js" },
    ],
  },
  {
    title: "In review",
    cards: [
      { title: "Homepage design, v2", tag: "bg-amber", avatar: "bg-av-lr" },
      { title: "Logo options", tag: "bg-amber", avatar: "bg-av-lr" },
    ],
  },
  {
    title: "Done",
    cards: [
      { title: "Sitemap", tag: "bg-green", avatar: "bg-av-ak" },
      { title: "Colour palette", tag: "bg-amber", avatar: "bg-av-lr" },
    ],
  },
];

/** The small three-column board in the Landing hero. */
export function MiniBoard() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-panel bg-panel p-[10px]">
      {COLUMNS.map((column) => (
        <div key={column.title} className="flex min-w-0 flex-col gap-2 rounded-side bg-soft-3 px-2 py-[10px]">
          <div className="flex justify-between px-1 text-xs font-medium">
            <span>{column.title}</span>
            <span className="text-muted">{column.cards.length}</span>
          </div>
          {column.cards.map((card) => (
            <div key={card.title} className="flex flex-col gap-[7px] rounded-control bg-card p-[10px] shadow-mini">
              <span className={cx("h-[3px] w-[22px] rounded-[2px]", card.tag)} />
              <span className="text-xs leading-[1.35] font-medium">{card.title}</span>
              <span className={cx("size-[18px] self-end rounded-full", card.avatar)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
