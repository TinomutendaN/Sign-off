"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyLink } from "@/components/ui/CopyLink";
import { cx } from "@/components/ui/cx";
import { Field } from "@/components/ui/Field";
import { inviteTeamMember, type TeamInviteResult } from "../actions";
import { inviteTeamMemberSchema, type TeamRole } from "../schemas";
import { SettingsSection } from "./SettingsSection";

const ROLE_OPTIONS: { key: TeamRole; label: string; desc: string }[] = [
  { key: "member", label: "Team member", desc: "Works on projects, tasks and deliverables." },
  { key: "owner", label: "Owner", desc: "Everything a team member can do, plus team, clients and billing." },
];

type Sent = Extract<TeamInviteResult, { ok: true }>;

/** "Invite a team member" (Owners only): email, Team member or Owner, "Send invite". */
export function InviteTeamPanel() {
  const [role, setRole] = useState<TeamRole>("member");
  const [sent, setSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = inviteTeamMemberSchema.safeParse({ email: new FormData(e.currentTarget).get("email"), role });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    const result = await inviteTeamMember(parsed.data);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSent(result);
  }

  function reset() {
    setSent(null);
    setRole("member");
  }

  return (
    <SettingsSection title="Invite a team member">
      <Card className="flex flex-col gap-[14px] p-4">
        {sent ? (
          <div className="flex flex-col items-center gap-2 px-1 py-3 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-green-tint text-green-ink">
              <CheckIcon size={22} />
            </span>
            <div className="text-[15px] font-semibold text-ink">{sent.emailSent ? "Invite sent" : "Invite ready"}</div>
            <div className="text-[13px] leading-normal text-muted">
              {sent.name} will join as {sent.role === "owner" ? "an owner" : "a team member"} once they accept.
            </div>
            {sent.url && (
              <div className="flex w-full flex-col gap-2 pt-1 text-left">
                <CopyLink url={sent.url} />
                <p className="m-0 text-center text-xs text-muted">Demo: no email is sent.</p>
              </div>
            )}
            <button
              type="button"
              onClick={reset}
              className="mt-1 rounded-control border border-panel bg-card px-[14px] py-[9px] text-[13px] font-medium text-ink"
            >
              Invite someone else
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={submit} className="flex flex-col gap-[14px]">
            <Field label="Email" name="email" type="email" autoComplete="off" placeholder="kuda@northfold.example" />
            <div role="radiogroup" aria-label="Role" className="flex flex-col gap-2">
              <span className="text-xs font-medium text-ink-2">Role</span>
              {ROLE_OPTIONS.map((o) => {
                const on = role === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setRole(o.key)}
                    className={cx(
                      "flex gap-[10px] rounded-control p-3 text-left",
                      on ? "border-2 border-violet bg-violet-soft" : "border border-line-strong bg-card",
                    )}
                  >
                    <span
                      className={cx(
                        "mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full border-2",
                        on ? "border-violet" : "border-line-dash",
                      )}
                    >
                      <span className={cx("size-2 rounded-full", on && "bg-violet")} />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-semibold text-ink">{o.label}</span>
                      <span className="text-xs leading-[1.45] text-muted">{o.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {error && (
              <p role="alert" className="m-0 text-[13px] text-red-ink">
                {error}
              </p>
            )}
            <Button type="submit" size="md" className="w-full py-[11px]" disabled={busy}>
              {busy ? "Sending…" : "Send invite"}
            </Button>
          </form>
        )}
      </Card>
    </SettingsSection>
  );
}
