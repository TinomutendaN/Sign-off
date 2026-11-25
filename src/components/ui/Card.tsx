import type { ComponentProps } from "react";
import { cx } from "./cx";

/** White card: 12 px corners and a very soft shadow. */
export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("rounded-card bg-card shadow-card", className)} {...rest} />;
}
