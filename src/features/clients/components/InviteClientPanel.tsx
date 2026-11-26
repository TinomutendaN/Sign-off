"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, SendIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyLink } from "@/components/ui/CopyLink";
import { Field } from "@/components/ui/Field";
import { createClientInvite, type InviteSent } from "../actions";
import { clientInviteSchema } from "../schemas";

type InviteClientPanelProps = {
  /** The invite just created or re-sent, shown as the "Invite sent" state. */
  sent: InviteSent | null;
  onSent: (sent: InviteSent | null) => void;
};

/**
 * "Invite a client": company, contact and first project, then "Create project and send invite".
 * Afterwards it shows the invite link with Copy. In the demo workspace no email is sent.
 */
export function InviteClientPanel({ sent, onSent }: InviteClientPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = clientInviteSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    const result = await createClientInvite(parsed.data);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onSent(result);
  }

  return (
    <section className="flex max-w-[380px] min-w-0 flex-[1_1_320px] flex-col gap-[10px] rounded-column bg-panel px-[10px] pt-3 pb-[10px] tablet:max-w-none">
      <div className="px-2 pt-1.5 pb-1">
        <h2 className="m-0 text-base font-medium text-ink">Invite a client</h2>
      </div>
      <Card className="flex flex-col gap-[14px] p-4">
        {sent ? (
          <>
            <div className="flex flex-col items-center gap-2 px-1 pt-2 pb-1 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-green-tint text-green-ink">
                <CheckIcon size={22} />
              </span>
              <div className="text-[15px] font-semibold text-ink">
                {sent.emailSent ? "Invite sent to" : "Invite ready for"} {sent.contactName}
              </div>
              <div className="text-[13px] leading-normal text-muted">
                The {sent.projectName} project is ready.{" "}
                {sent.emailSent ? "You can also share this link yourself." : "Share this link with them."}
              </div>
            </div>
            <CopyLink url={sent.url} />
            {!sent.emailSent && <p className="m-0 text-center text-xs text-muted">Demo: no email is sent.</p>}
            <button
              type="button"
              onClick={() => onSent(null)}
              className="rounded-control border border-panel bg-card px-[14px] py-[10px] text-[13px] font-medium text-ink"
            >
              Invite another client
            </button>
          </>
        ) : (
          <form noValidate onSubmit={submit} className="flex flex-col gap-[14px]">
            <p className="m-0 text-[13px] leading-normal text-muted">
              Your client gets their own portal. They only see the projects you share, and they never pay.
            </p>
            <Field label="Company" name="company" autoComplete="organization" placeholder="Kopje Physio" />
            <Field label="Contact name" name="contactName" autoComplete="name" placeholder="Rudo C." />
            <Field
              label="Contact email"
              name="contactEmail"
              type="email"
              autoComplete="email"
              placeholder="rudo@kopjephysio.example"
            />
            <Field label="First project" name="projectName" placeholder="Booking app" />
            {error && (
              <p role="alert" className="m-0 text-[13px] text-red-ink">
                {error}
              </p>
            )}
            <Button type="submit" size="md" className="w-full py-[11px]" icon={<SendIcon />} disabled={busy}>
              {busy ? "Creating…" : "Create project and send invite"}
            </Button>
          </form>
        )}
      </Card>
    </section>
  );
}
