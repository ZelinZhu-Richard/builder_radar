import type { ComponentPropsWithoutRef } from "react";
import { cx } from "@/lib/utils";

export function Panel({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cx(
        "rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(18,24,33,0.92),rgba(9,13,18,0.94))] shadow-[0_18px_60px_-36px_rgba(0,0,0,0.92)]",
        className,
      )}
      {...props}
    />
  );
}
