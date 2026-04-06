import type { HydratedEvent } from "@/types";
import { EventCard } from "./event-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";

export function SectionCard({
  title,
  description,
  rankLabel,
  events,
  className,
}: {
  title: string;
  description: string;
  rankLabel: string;
  events: HydratedEvent[];
  className?: string;
}) {
  return (
    <Panel className={className}>
      <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Section</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-strong">{description}</p>
        </div>

        <div className="rounded-full border border-border bg-white/[0.04] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-strong">
          {rankLabel}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {events.length > 0 ? (
          events.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <EmptyState
            title="No events ranked for this section"
            description="The section shell is ready, but the current placeholder dataset has not populated it."
          />
        )}
      </div>
    </Panel>
  );
}
