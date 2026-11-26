"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { CompanySquare } from "@/components/ui/CompanySquare";
import { Field } from "@/components/ui/Field";
import { nameInitials } from "@/lib/format";
import { renameWorkspace } from "../actions";
import { renameWorkspaceSchema } from "../schemas";
import { SettingsSection } from "./SettingsSection";

type WorkspacePanelProps = {
  name: string;
  /** Where clients open their portal: "sign-off.vercel.app/portal". Shown, not editable. */
  portalAddress: string;
  /** Owners can rename the workspace; Team members see it read-only. */
  canEdit: boolean;
};

/** "Workspace": the NS square, the name (Owners can change it) and the client portal address. */
export function WorkspacePanel({ name, portalAddress, canEdit }: WorkspacePanelProps) {
  const [current, setCurrent] = useState(name);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const parsed = renameWorkspaceSchema.safeParse({ name: current });
    if (!parsed.success) return setMessage({ error: true, text: parsed.error.issues[0].message });
    setBusy(true);
    const result = await renameWorkspace(parsed.data);
    setBusy(false);
    setMessage(result.ok ? { error: false, text: "Saved." } : { error: true, text: result.error });
  }

  return (
    <SettingsSection title="Workspace">
      <Card className="p-[18px]">
        <form noValidate onSubmit={save} className="flex flex-wrap items-end gap-4">
          <CompanySquare label={nameInitials(current || name)} tone="workspace" size={56} />
          <Field
            label="Workspace name"
            name="name"
            textSize={14}
            className="flex-[1_1_220px]"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            readOnly={!canEdit}
          />
          <Field
            label="Client portal address"
            name="portal"
            textSize={14}
            className="flex-[1_1_220px]"
            value={portalAddress}
            readOnly
            title="Where your clients open their portal"
          />
          {canEdit && (
            <button
              type="submit"
              disabled={busy || current.trim() === name}
              className="rounded-control border border-line-strong bg-card px-4 py-[10px] text-[13px] font-medium text-ink shadow-xs disabled:cursor-default"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          )}
        </form>
        {message && (
          <p role="status" className={`m-0 pt-3 text-[13px] ${message.error ? "text-red-ink" : "text-green-ink"}`}>
            {message.text}
          </p>
        )}
      </Card>
    </SettingsSection>
  );
}
