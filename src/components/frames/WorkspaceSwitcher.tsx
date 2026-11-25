"use client";

import { useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "@/components/icons";
import { SideIdentity } from "./SideIdentity";

type WorkspaceSwitcherProps = {
  orgId: string;
  name: string;
  initials: string;
  subtitle: string;
};

/** Our own workspace switcher (not Clerk's OrganizationSwitcher, which shows emails). */
export function WorkspaceSwitcher({ orgId, name, initials, subtitle }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({ userMemberships: true });

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

  async function choose(id: string) {
    setOpen(false);
    if (id === orgId || !setActive) return;
    await setActive({ organization: id });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-[10px] rounded-card p-2"
      >
        <SideIdentity
          initials={initials}
          square="peach"
          title={name}
          subtitle={subtitle}
          end={<ChevronsUpDownIcon className="shrink-0 text-muted" />}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute inset-x-0 top-full z-40 mt-1 flex flex-col gap-0.5 rounded-card border border-line bg-card p-1.5 shadow-raised"
        >
          {!isLoaded && <div className="px-2 py-2 text-xs text-muted">Loading…</div>}
          {userMemberships.data?.map(({ organization }) => (
            <button
              key={organization.id}
              type="button"
              role="menuitem"
              onClick={() => choose(organization.id)}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-ink hover:bg-soft"
            >
              <span className="min-w-0 flex-1 truncate">{organization.name}</span>
              {organization.id === orgId && <CheckIcon size={14} className="text-violet-icon" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
