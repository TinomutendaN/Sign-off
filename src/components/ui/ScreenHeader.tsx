import type { ReactNode } from "react";

type ScreenHeaderProps = {
  /** Icon inside the 44 px soft-grey tile. */
  icon: ReactNode;
  title: ReactNode;
  /** Small things right after the title (a star, a "Demo data" pill). */
  afterTitle?: ReactNode;
  subtitle: ReactNode;
  /** Right side: search, avatars, buttons. */
  children?: ReactNode;
};

/** Screen header: icon tile, 26 px title, 12 px grey subline, actions on the right. */
export function ScreenHeader({ icon, title, afterTitle, subtitle, children }: ScreenHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-[14px]">
      <div className="flex min-w-0 flex-[1_1_320px] items-center gap-[14px]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-card bg-soft text-violet-icon">
          {icon}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-[10px]">
            <h1 className="m-0 text-[26px] font-medium tracking-[-0.01em] text-ink">{title}</h1>
            {afterTitle}
          </div>
          <div className="text-xs text-muted">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
