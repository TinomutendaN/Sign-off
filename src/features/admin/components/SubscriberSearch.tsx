"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";

/** "Workspace or owner…": updates ?q= shortly after typing stops and goes back to page 1. */
export function SubscriberSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function update(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = new URLSearchParams(params.toString());
      if (next.trim()) query.set("q", next.trim());
      else query.delete("q");
      query.delete("page");
      const qs = query.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
  }

  return (
    <label className="flex w-[230px] items-center gap-2 rounded-control border border-panel px-3 py-[9px] text-[13px] text-muted shadow-xs phone:w-full">
      <SearchIcon />
      <input
        type="search"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="Workspace or owner…"
        aria-label="Search subscribers by workspace or owner"
        maxLength={80}
        className="w-full border-0 bg-transparent text-ink outline-none placeholder:text-muted"
      />
    </label>
  );
}
