import { Button } from "@/components/ui/Button";

/** The dark band at the bottom of Landing: "Start with your next client". */
export function ClosingBand() {
  return (
    <section className="mx-auto mt-6 flex w-full max-w-[1180px] flex-wrap items-center gap-6 rounded-section bg-ink px-8 py-10">
      <div className="flex flex-[1_1_360px] flex-col gap-2">
        <h2 className="m-0 text-[28px] font-semibold tracking-[-0.02em] text-white">Start with your next client</h2>
        <p className="m-0 text-[15px] leading-[1.6] text-line-dash">
          Free for one workspace and two projects. Upgrade when you&apos;re ready.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button href="/sign-up" variant="light" size="lg">
          Start free
        </Button>
        <Button href="/sign-in" variant="on-navy" size="lg">
          Try the demo
        </Button>
      </div>
    </section>
  );
}
