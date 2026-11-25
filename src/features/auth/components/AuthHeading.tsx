/** The Sign in screen title and grey subline. */
export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="m-0 text-[30px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
      <p className="m-0 text-sm leading-normal text-muted">{subtitle}</p>
    </div>
  );
}
