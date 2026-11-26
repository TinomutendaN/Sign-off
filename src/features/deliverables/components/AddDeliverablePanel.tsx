"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DeliverableForm, type FormOptions } from "./DeliverableForm";

type Replaceable = { id: string; title: string; milestoneId: string };
type PanelProps = FormOptions & { replaceable: Replaceable[] };

/**
 * "Add a deliverable". `?replace={deliverableId}` (from "Upload new version") opens the same form
 * prefilled with that deliverable's title and milestone; the form starts fresh whenever it changes.
 */
export function AddDeliverablePanel({ replaceable, ...options }: PanelProps) {
  return (
    <section
      id="add-deliverable"
      className="flex max-w-[380px] min-w-0 flex-[1_1_320px] scroll-mt-4 flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px] tablet:max-w-none"
    >
      <div className="px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">Add a deliverable</h2>
      </div>
      <Suspense fallback={<DeliverableForm {...options} replacing={null} />}>
        <FormForUrl options={options} replaceable={replaceable} />
      </Suspense>
    </section>
  );
}

function FormForUrl({ options, replaceable }: { options: FormOptions; replaceable: Replaceable[] }) {
  const replaceId = useSearchParams().get("replace");
  const replacing = replaceable.find((d) => d.id === replaceId) ?? null;
  // Keyed on the URL value, so the "Sent for approval" state survives the refresh after sending
  // (the replaced deliverable then drops out of `replaceable`).
  return <DeliverableForm key={replaceId ?? "new"} {...options} replacing={replacing} />;
}
