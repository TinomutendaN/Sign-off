"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Avatar, type AvatarTone } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

type UserMenuProps = {
  firstName: string | null;
  lastName: string | null;
  name: string;
  tone: AvatarTone;
  /** Clients show as their company: the peach "BB" square instead of their own initials. */
  companyInitials?: string;
};

/** Our own avatar menu (initials, name, Sign out). Never shows an email address. */
export function UserMenu({ firstName, lastName, name, tone, companyInitials }: UserMenuProps) {
  const avatar = companyInitials ? (
    <Avatar label={companyInitials} shape="square" tone={tone} size={32} />
  ) : (
    <Avatar person={{ firstName, lastName }} tone={tone} size={32} />
  );

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative mt-1.5 flex phone:mt-0 phone:items-center">
      <button
        type="button"
        aria-label={`Account menu for ${name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center rounded-card"
      >
        {avatar}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-0 left-full z-40 ml-2 flex w-48 flex-col gap-3 rounded-card border border-line bg-card p-3 shadow-raised phone:bottom-full phone:left-auto phone:right-0 phone:mb-2 phone:ml-0"
        >
          <div className="flex items-center gap-[10px]">
            {avatar}
            <span className="min-w-0 truncate text-[13px] font-semibold text-ink">{name}</span>
          </div>
          <SignOutButton redirectUrl="/">
            <Button variant="outline" size="block" role="menuitem">
              Sign out
            </Button>
          </SignOutButton>
        </div>
      )}
    </div>
  );
}
