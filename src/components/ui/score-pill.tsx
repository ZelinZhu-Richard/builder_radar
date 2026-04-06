import { cx } from "@/lib/utils";

function tone(value: number) {
  if (value >= 85) {
    return "border-[rgba(122,203,146,0.28)] bg-[rgba(122,203,146,0.08)] text-success";
  }

  if (value >= 70) {
    return "border-[rgba(119,169,212,0.28)] bg-[rgba(119,169,212,0.08)] text-info";
  }

  return "border-border bg-white/5 text-muted-strong";
}

export function ScorePill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex min-w-[72px] flex-col rounded-xl border px-3 py-2 text-right",
        tone(value),
        className,
      )}
    >
      <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">{label}</span>
      <span className="mt-1 font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}
