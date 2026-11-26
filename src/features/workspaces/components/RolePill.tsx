import { cx } from "@/components/ui/cx";

const tones = {
  Owner: "bg-violet-tint text-violet-ink",
  "Team member": "bg-soft-2 text-ink-3",
  Pending: "bg-amber-tint text-amber-ink",
  Client: "bg-amber-tint text-amber-ink",
  "Invite sent": "bg-soft-2 text-ink-3",
} as const;

/** The role pill on Team settings rows (12 px, 4×10 padding). */
export function RolePill({ role, wide = false }: { role: keyof typeof tones; wide?: boolean }) {
  return (
    <span
      className={cx(
        "rounded-full px-[10px] py-1 text-center text-xs font-semibold whitespace-nowrap",
        wide && "min-w-[90px]",
        tones[role],
      )}
    >
      {role}
    </span>
  );
}
