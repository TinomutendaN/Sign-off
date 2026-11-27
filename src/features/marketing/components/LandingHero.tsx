import { ArrowRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ApprovalCard } from "./ApprovalCard";
import { MiniBoard } from "./MiniBoard";

/** Landing hero: headline and calls to action on the left, the board picture on the right. */
export function LandingHero() {
  return (
    // Capped at the old window width (1440 px), so it keeps the design's proportions now the window fills the screen.
    <section className="mx-auto flex w-full max-w-[1420px] flex-wrap items-center gap-10 px-10 pt-14 pb-12 phone:px-[10px] phone:py-7">
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
        <span className="self-start rounded-full bg-violet-tint px-[10px] py-[5px] text-xs font-semibold text-violet-ink">
          For freelancers and small agencies
        </span>
        <h1 className="m-0 text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] phone:text-[32px]">
          Get client sign-off without chasing emails
        </h1>
        <p className="m-0 max-w-[520px] text-lg leading-[1.6] text-muted">
          Run projects, tasks and milestones in one place. Your clients follow progress and approve work in their own
          portal, and every decision is saved.
        </p>
        <div className="mt-1 flex flex-wrap gap-3">
          <Button href="/sign-in" size="lg">
            Try the demo
            <ArrowRightIcon />
          </Button>
          <Button href="/pricing" variant="outline" size="lg">
            See pricing
          </Button>
        </div>
        <div className="text-[13px] text-muted">Free for your first client. No card needed.</div>
      </div>

      <div
        role="img"
        aria-label="SIGNoFF board with a client approval card"
        className="relative min-w-0 flex-[1_1_480px] pt-[10px] pr-6 pb-7"
      >
        <MiniBoard />
        <ApprovalCard />
      </div>
    </section>
  );
}
