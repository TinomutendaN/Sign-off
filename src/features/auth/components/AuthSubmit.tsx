import type { ReactNode } from "react";

/** Full-width violet submit button (12 px padding, 15 px text, violet glow). */
export function AuthSubmit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="w-full rounded-control bg-violet p-3 text-center text-[15px] font-medium text-white shadow-violet transition-opacity disabled:cursor-wait disabled:opacity-70"
    >
      {children}
    </button>
  );
}
