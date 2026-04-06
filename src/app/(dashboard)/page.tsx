import { AlertPanel } from "@/components/dashboard/alert-panel";
import { SectionCard } from "@/components/dashboard/section-card";
import { PageIntro } from "@/components/layout/page-intro";
import { NoMajorChangeState } from "@/components/ui/no-major-change-state";
import { ROUTE_META } from "@/lib/navigation";
import { getHomepageSections, getHydratedAlerts } from "@/lib/mock";
import { cx } from "@/lib/utils";

const rankLabelMap = {
  "composite-signal": "Composite signal",
  "first-hand-velocity": "First-hand velocity",
  "workflow-value": "Workflow value",
  "opportunity-window": "Opportunity window",
  "builder-traction": "Builder traction",
} as const;

export default function HomePage() {
  const sections = getHomepageSections();
  const alerts = getHydratedAlerts();
  const meta = ROUTE_META.overview;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        metrics={meta.metrics}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6 2xl:grid-cols-2">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              title={section.title}
              description={section.description}
              rankLabel={rankLabelMap[section.rankStrategy]}
              events={section.events}
              className={cx(index === 0 && "2xl:col-span-2")}
            />
          ))}
        </div>

        <aside className="space-y-6">
          <AlertPanel alerts={alerts} title="Board alerts" />
          <NoMajorChangeState
            title="Performance lane"
            message="No major change in recovery, focus, or personal growth signals this cycle. The dashboard should say that directly instead of manufacturing urgency."
          />
        </aside>
      </div>
    </div>
  );
}
