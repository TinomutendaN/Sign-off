import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { DemoSection } from "./DemoSection";

/**
 * Sign in screen (03): the form on the left, "Try the demo" on the right. The two halves
 * sit side by side on a laptop and stack on tablets and phones.
 */
export function AuthScreen({ demo = false, children }: { demo?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-wrap gap-[10px]">
      <section className="flex min-w-0 flex-[1_1_460px] flex-col items-center gap-7 px-6 py-7">
        <Link href="/" className="flex items-center gap-[10px] self-start text-ink hover:text-ink">
          <span className="flex size-9 items-center justify-center rounded-[11px] bg-violet-icon text-[13px] font-bold text-white">
            So
          </span>
          <span className="text-lg font-bold tracking-[-0.01em]">SIGNoFF</span>
        </Link>
        <div className="flex w-full max-w-[420px] flex-col gap-5 pt-3 pb-6 tablet:max-w-none">{children}</div>
      </section>
      {demo && (
        <Suspense fallback={<section aria-hidden className="min-w-0 flex-[1_1_460px] rounded-panel bg-panel" />}>
          <DemoSection />
        </Suspense>
      )}
    </div>
  );
}
