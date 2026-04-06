import { AlertPanel } from "@/components/dashboard/alert-panel";
import { SectionCard } from "@/components/dashboard/section-card";
import { PageIntro } from "@/components/layout/page-intro";
import { EmptyState } from "@/components/ui/empty-state";
import { NoMajorChangeState } from "@/components/ui/no-major-change-state";
import { Panel } from "@/components/ui/panel";
import { ROUTE_META } from "@/lib/navigation";
import { getEventCountForRoute, getHydratedAlerts, getLaneEvents } from "@/lib/mock";
import type { AppRouteKey } from "@/types";

function renderSettingsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Source trust</p>
        <h3 className="mt-3 text-lg font-semibold text-foreground">Trust tiers</h3>
        <p className="mt-2 text-sm leading-6 text-muted-strong">
          Reserve space for explicit source policies, verification thresholds, and manual overrides.
        </p>
      </Panel>
      <Panel className="px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Ranking controls</p>
        <h3 className="mt-3 text-lg font-semibold text-foreground">Weighting rules</h3>
        <p className="mt-2 text-sm leading-6 text-muted-strong">
          Adjust how signal, confidence, urgency, and first-hand status influence section rank.
        </p>
      </Panel>
      <Panel className="px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Delivery</p>
        <h3 className="mt-3 text-lg font-semibold text-foreground">Alerts and digests</h3>
        <p className="mt-2 text-sm leading-6 text-muted-strong">
          Hold the future controls for email delivery, push thresholds, and refresh windows.
        </p>
      </Panel>
    </div>
  );
}

export function LanePage({ route }: { route: Exclude<AppRouteKey, "overview"> }) {
  const meta = ROUTE_META[route];

  if (route === "alerts") {
    const alerts = getHydratedAlerts();

    return (
      <div className="space-y-6">
        <PageIntro eyebrow={meta.eyebrow} title={meta.title} description={meta.description} metrics={meta.metrics} />
        <AlertPanel alerts={alerts} title="Active watches and escalations" />
        <NoMajorChangeState
          title="Escalation discipline"
          message="No additional alert classes are scaffolded yet. New alerts should only exist if they map to a decision, follow-up, or watch state."
        />
      </div>
    );
  }

  if (route === "archive") {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow={meta.eyebrow} title={meta.title} description={meta.description} metrics={meta.metrics} />
        <EmptyState
          title="Archive views are scaffolded but intentionally empty"
          description="Canonical event history, prior-cycle snapshots, and diff tooling belong here once real ingestion and retention exist."
        />
      </div>
    );
  }

  if (route === "settings") {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow={meta.eyebrow} title={meta.title} description={meta.description} metrics={meta.metrics} />
        {renderSettingsPage()}
      </div>
    );
  }

  const events = getLaneEvents(route, 4);
  const metrics = [
    ...meta.metrics,
    {
      label: "Signals tracking",
      value: `${getEventCountForRoute(route)}`,
      detail: "Current typed placeholder count for this lane.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageIntro eyebrow={meta.eyebrow} title={meta.title} description={meta.description} metrics={metrics} />

      {route === "performance" ? (
        <NoMajorChangeState
          title="Performance lane is intentionally calm"
          message="The current placeholder board includes useful guidance, but no new performance event is strong enough to justify forced urgency."
        />
      ) : null}

      <SectionCard
        title="Current lane board"
        description="Static placeholder events filtered for this lane so the shell, card system, and navigation are ready for real ingestion."
        rankLabel="Lane board"
        events={events}
      />
    </div>
  );
}
