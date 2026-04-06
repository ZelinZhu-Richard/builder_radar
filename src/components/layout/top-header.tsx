import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/navigation";

export function TopHeader() {
  return (
    <header className="border-b border-border bg-[rgba(2,4,9,0.78)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
            Personal trust-first AI edge dashboard
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {APP_NAME}
            </h2>
            <Badge variant="accent">Event-first</Badge>
            <Badge variant="success">2h cadence</Badge>
            <Badge variant="info">Mock data</Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Ranking</p>
            <p className="mt-1 font-mono text-sm text-foreground">signal / confidence / urgency</p>
          </div>
          <div className="rounded-xl border border-border bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Grouping</p>
            <p className="mt-1 font-mono text-sm text-foreground">canonical events</p>
          </div>
          <div className="rounded-xl border border-border bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Honesty</p>
            <p className="mt-1 font-mono text-sm text-foreground">show no major change</p>
          </div>
        </div>
      </div>
    </header>
  );
}
