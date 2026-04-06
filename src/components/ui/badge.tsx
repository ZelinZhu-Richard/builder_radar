import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "critical"
  | "info";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-border bg-white/5 text-muted-strong",
  accent: "border-[rgba(208,178,127,0.26)] bg-accent-soft text-accent",
  success: "border-[rgba(122,203,146,0.28)] bg-[rgba(122,203,146,0.1)] text-success",
  warning: "border-[rgba(212,176,98,0.28)] bg-[rgba(212,176,98,0.1)] text-warning",
  critical: "border-[rgba(215,127,118,0.28)] bg-[rgba(215,127,118,0.1)] text-critical",
  info: "border-[rgba(119,169,212,0.28)] bg-[rgba(119,169,212,0.1)] text-info",
};

export function Badge({
  children,
  className,
  variant = "neutral",
}: {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em]",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
