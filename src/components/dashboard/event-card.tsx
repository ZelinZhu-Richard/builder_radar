import { formatTimestamp } from "@/lib/format";
import type { HydratedEvent, TrustTier } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ScorePill } from "@/components/ui/score-pill";
import { cx } from "@/lib/utils";

const trustVariant: Record<TrustTier, "success" | "info" | "accent" | "warning"> = {
  primary: "success",
  verified: "info",
  trusted: "accent",
  monitor: "warning",
};

const statusVariant = {
  new: "accent",
  developing: "info",
  steady: "neutral",
  archived: "neutral",
} as const;

export function EventCard({
  event,
  className,
}: {
  event: HydratedEvent;
  className?: string;
}) {
  return (
    <article
      className={cx(
        "rounded-2xl border border-border bg-surface-muted/70 p-4 transition-colors hover:border-border-strong hover:bg-surface-muted",
        className,
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
            <Badge variant={trustVariant[event.canonicalSource.trustTier]}>
              {event.canonicalSource.trustTier}
            </Badge>
            <Badge variant={event.changedSinceLastCycle ? "accent" : "neutral"}>
              {event.changedSinceLastCycle ? "changed" : "holding"}
            </Badge>
          </div>

          <h3 className="mt-4 text-lg font-semibold leading-7 text-foreground">
            {event.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-strong">{event.summary}</p>
        </div>

        <div className="flex gap-2">
          <ScorePill label="Edge" value={event.score.signal} />
          <ScorePill label="Conviction" value={event.score.confidence} />
          <ScorePill label="Speed" value={event.score.urgency} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_248px]">
        <div className="rounded-xl border border-border bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Canonical item</p>
          <p className="mt-2 text-sm text-foreground">{event.primaryItem.title}</p>
          <p className="mt-2 text-xs leading-5 text-muted">
            {event.canonicalSource.name} • {formatTimestamp(event.updatedAt)}
          </p>
          {event.trustedAmplification.length > 0 ? (
            <p className="mt-3 text-xs leading-5 text-muted-strong">
              Trusted amplification from{" "}
              {event.amplificationSources.map((source) => source.name).join(", ")}.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-white/[0.03] px-3 py-3">
          {event.opportunity ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Opportunity</p>
              <p className="mt-2 text-sm text-foreground">{event.opportunity.title}</p>
              <p className="mt-2 text-xs leading-5 text-muted-strong">
                {event.opportunity.nextStep}
              </p>
              <p className="mt-2 font-mono text-xs text-accent">{event.opportunity.timeframe}</p>
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
