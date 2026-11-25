import type { ComponentProps } from "react";
import { cx } from "./cx";

const control =
  "rounded-control border border-line-strong bg-card px-3 py-[10px] font-normal text-ink outline-none placeholder:text-muted focus:border-violet";

type Common = { label: string; textSize?: 13 | 14; className?: string };
type InputField = Common & { multiline?: false } & Omit<ComponentProps<"input">, "className">;
type TextareaField = Common & { multiline: true } & Omit<ComponentProps<"textarea">, "className">;

/** Label above an input or textarea (12 px label, 6 px gap, 10×12 control). */
export function Field(props: InputField | TextareaField) {
  const { label, textSize = 13, className } = props;
  const size = textSize === 14 ? "text-sm" : "text-[13px]";

  return (
    <label className={cx("flex flex-col gap-1.5 text-xs font-medium text-ink-2", className)}>
      {label}
      {props.multiline ? (
        <textarea {...omit(props)} className={cx(control, size, "resize-y leading-normal")} />
      ) : (
        <input {...omit(props)} className={cx(control, size)} />
      )}
    </label>
  );
}

function omit<T extends Common & { multiline?: boolean }>(props: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { label, textSize, className, multiline, ...rest } = props;
  return rest;
}
