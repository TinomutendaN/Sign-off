"use client";

import { useClerk, useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";
import { startDemo } from "../actions";
import { errorMessage, finalizeSession, go, openWorkspace } from "../clerkFlow";
import type { DemoCard } from "../queries";
import type { DemoRole } from "../schemas";
import { AuthError } from "./AuthError";

/**
 * "Try the demo": pick one of four people, then sign in as them with a one-minute Clerk
 * sign-in token made on the server. Only the role key leaves the browser.
 */
export function DemoPanel({ cards }: { cards: DemoCard[] }) {
  const { signIn } = useSignIn();
  const clerk = useClerk();
  const [role, setRole] = useState<DemoRole>("owner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = cards.find((c) => c.role === role) ?? cards[0];

  async function enter() {
    setBusy(true);
    setError(null);

    const fail = (message: string) => {
      setError(message);
      setBusy(false);
    };

    const start = await startDemo(role);
    if (!start.ok) return fail(start.error);

    const { error: ticketError } = await signIn.ticket({ ticket: start.ticket });
    if (ticketError) return fail(errorMessage(ticketError));
    if (signIn.status !== "complete") return fail("Couldn't start the demo. Please try again.");

    const { error: finalizeError, decorate } = await finalizeSession(signIn);
    if (finalizeError) return fail(errorMessage(finalizeError));
    if (start.orgId) await openWorkspace(clerk, start.orgId);
    go(decorate(start.path));
  }

  return (
    <section className="flex min-w-0 flex-[1_1_460px] flex-col justify-center gap-[18px] rounded-panel bg-panel px-6 py-7">
      <div className="flex flex-col gap-1.5 px-1">
        <span className="self-start rounded-full bg-card px-[9px] py-1 text-[11px] font-semibold text-violet-ink">
          No sign-up needed
        </span>
        <h2 className="m-0 text-2xl font-semibold tracking-[-0.01em] text-ink">Try the demo</h2>
        <p className="m-0 text-sm leading-normal text-muted">
          Pick a role to see SIGNoFF the way that person would.
        </p>
      </div>

      <div role="radiogroup" aria-label="Demo role" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[10px]">
        {cards.map((card) => {
          const on = card.role === role;
          return (
            <button
              key={card.role}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setRole(card.role)}
              className={cx(
                "flex flex-col gap-3 rounded-side bg-card p-4 text-left",
                on ? "shadow-raised outline-2 outline-violet" : "shadow-card",
              )}
            >
              <span className="flex w-full items-center gap-[10px]">
                <Avatar label={card.initials} tone={card.tone} size={34} />
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-ink">{card.title}</span>
                  <span className="text-xs text-muted">{card.who}</span>
                </span>
                <span
                  className={cx(
                    "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2",
                    on ? "border-violet" : "border-line-dash",
                  )}
                >
                  <span className={cx("size-2 rounded-full", on && "bg-violet")} />
                </span>
              </span>
              <span className="text-[13px] leading-normal text-ink-2">{card.description}</span>
            </button>
          );
        })}
      </div>

      <AuthError message={error} />

      <button
        type="button"
        onClick={enter}
        disabled={busy}
        aria-busy={busy}
        className="flex items-center justify-center gap-2 rounded-control bg-ink p-3 text-[15px] font-medium text-white shadow-navy transition-opacity disabled:cursor-wait disabled:opacity-80"
      >
        Enter as {selected.buttonLabel}
        <ArrowRightIcon />
      </button>
    </section>
  );
}
