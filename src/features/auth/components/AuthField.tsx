import type { ComponentProps, ReactNode } from "react";

type AuthFieldProps = Omit<ComponentProps<"input">, "className"> & {
  label: string;
  /** Extra content at the right of the label ("Forgot password?"). */
  aside?: ReactNode;
};

/** Sign in screen field: 13 px label, 6 px gap, 11×12 px input with 10 px corners. */
export function AuthField({ label, aside, ...input }: AuthFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
      {aside ? (
        <span className="flex justify-between">
          {label}
          {aside}
        </span>
      ) : (
        label
      )}
      <input
        {...input}
        className="rounded-control border border-line-strong bg-card px-3 py-[11px] text-sm font-normal text-ink outline-none placeholder:text-faint focus:border-violet"
      />
    </label>
  );
}
