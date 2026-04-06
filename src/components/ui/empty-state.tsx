import { Panel } from "./panel";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Panel className="border-dashed px-5 py-6">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Placeholder</p>
      <h3 className="mt-3 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-strong">{description}</p>
    </Panel>
  );
}
