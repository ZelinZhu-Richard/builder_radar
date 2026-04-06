import { formatTimestamp } from "@/lib/format";
import type { HydratedAlert } from "@/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";

const severityVariant = {
  low: "neutral",
  medium: "warning",
  high: "critical",
  critical: "critical",
} as const;

const stateVariant = {
  active: "critical",
  watching: "warning",
  stable: "success",
  resolved: "neutral",
} as const;

export function AlertPanel({
  alerts,
  title = "Alert panel",
}: {
  alerts: HydratedAlert[];
  title?: string;
}) {
  return (
    <Panel>
      <div className="border-b border-border px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Operations</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2>
      </div>

      <div className="space-y-3 px-4 py-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <article
              key={alert.id}
              className="rounded-2xl border border-border bg-surface-muted/70 px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                <Badge variant={stateVariant[alert.state]}>{alert.state}</Badge>
              </div>
              <h3 className="mt-3 text-base font-semibold text-foreground">{alert.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-strong">{alert.summary}</p>
              <p className="mt-3 text-xs leading-5 text-muted">
                Triggered {formatTimestamp(alert.triggeredAt)}
              </p>
              <p className="mt-3 text-xs leading-5 text-muted-strong">
                Related: {alert.relatedEvents.map((event) => event.title).join(" • ")}
              </p>
              <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-foreground">
                {alert.followUp}
              </p>
            </article>
          ))
        ) : (
          <EmptyState
            title="No alerts are active"
            description="The alert system shell is ready, but the current state does not require escalation."
          />
        )}
      </div>
    </Panel>
  );
}
