"use client";

import { useState } from "react";

/** A link in a soft-grey row with a white "Copy" button that turns into "Copied". */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-control bg-soft py-1.5 pr-1.5 pl-3">
      <span className="min-w-0 flex-1 truncate text-xs text-ink-2" title={url}>
        {url.replace(/^https?:\/\//, "")}
      </span>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg bg-card px-3 py-[7px] text-xs font-semibold text-ink shadow-switch"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
