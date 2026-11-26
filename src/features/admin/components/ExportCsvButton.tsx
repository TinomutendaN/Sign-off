"use client";

import { useState, useTransition } from "react";
import { DownloadIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { exportSubscribersCsv } from "../actions";
import type { SubscriberFilter } from "../schemas";

/** "Export CSV": asks the server for the subscriber list as CSV and downloads it. */
export function ExportCsvButton({ filter }: { filter?: Omit<SubscriberFilter, "page"> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function exportCsv() {
    setError(null);
    startTransition(async () => {
      const result = await exportSubscribersCsv(filter ?? {});
      if (!result.ok) return setError(result.error);
      const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" icon={<DownloadIcon size={16} strokeWidth={2} />} onClick={exportCsv} disabled={pending}>
        {pending ? "Exporting…" : "Export CSV"}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-ink">
          {error}
        </span>
      )}
    </div>
  );
}
