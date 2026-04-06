import type { RouteMetric } from "@/lib/navigation";
import { Panel } from "@/components/ui/panel";

export function PageIntro({
  eyebrow,
  title,
  description,
  metrics,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics: RouteMetric[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-strong sm:text-[15px]">
          {description}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Panel key={metric.label} className="px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
              {metric.label}
            </p>
            <p className="mt-2 font-mono text-sm text-foreground">{metric.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{metric.detail}</p>
          </Panel>
        ))}
      </div>
    </section>
  );
}
