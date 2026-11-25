/** Temporary page body until the real screen is built. */
export function ScreenPlaceholder({ title, step, note }: { title: string; step: number; note?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="m-0 text-[26px] font-medium tracking-[-0.01em] text-ink">{title}</h1>
      <p className="m-0 text-[13px] text-muted">
        Placeholder. This screen is built in Step {step}.{note ? ` ${note}` : ""}
      </p>
    </div>
  );
}
