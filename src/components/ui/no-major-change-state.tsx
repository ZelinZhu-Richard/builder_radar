import { Badge } from "./badge";
import { Panel } from "./panel";

export function NoMajorChangeState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Panel className="border-dashed px-5 py-5">
      <Badge variant="accent">No major change</Badge>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-strong">{message}</p>
    </Panel>
  );
}
