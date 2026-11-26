"use client";

import { useClerk } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { refreshBilling } from "../actions";
import { clerkPeriod, type Period } from "../plans";

type PlanCheckoutButtonProps = {
  /** Clerk's plan ID (getPlanIds). Null if Clerk couldn't be reached: the button is disabled. */
  planId: string | null;
  period: Period;
  variant?: "primary" | "outline";
  size?: "md" | "block";
  className?: string;
  icon?: ReactNode;
  /** Open checkout as soon as the page loads (/billing?checkout=pro&period=annual after sign-up). */
  autoOpen?: boolean;
  children: ReactNode;
};

/**
 * Opens Clerk's checkout window for the workspace (organization) on a paid plan and period.
 * When the payment goes through, the session is reloaded (so has() sees the new plan), our
 * subscription copy is refreshed, and the page re-renders on the paid state.
 */
export function PlanCheckoutButton({
  planId,
  period,
  variant = "primary",
  size = "md",
  className,
  icon,
  autoOpen = false,
  children,
}: PlanCheckoutButtonProps) {
  const clerk = useClerk();
  const router = useRouter();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (!autoOpen || opened.current || !clerk.loaded || !planId) return;
    const button = wrapRef.current?.querySelector("button");
    if (!button) return;
    opened.current = true;
    button.click();
  }, [autoOpen, clerk.loaded, planId]);

  const button = (
    <Button variant={variant} size={size} className={className} icon={icon} disabled={!planId}>
      {children}
    </Button>
  );
  if (!planId) return button;

  async function done() {
    await clerk.session?.reload();
    await refreshBilling();
    router.refresh();
  }

  return (
    <span ref={wrapRef} className="contents">
      <CheckoutButton
        planId={planId}
        planPeriod={clerkPeriod(period)}
        for="organization"
        newSubscriptionRedirectUrl="/billing"
        onSubscriptionComplete={done}
      >
        {button}
      </CheckoutButton>
    </span>
  );
}
