import type { AppRouteKey } from "./app";
import type { HydratedEvent } from "./event";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertState = "active" | "watching" | "stable" | "resolved";

export interface Alert {
  id: string;
  title: string;
  summary: string;
  severity: AlertSeverity;
  state: AlertState;
  route: AppRouteKey;
  triggeredAt: string;
  relatedEventIds: string[];
  followUp: string;
}

export interface HydratedAlert extends Omit<Alert, "relatedEventIds"> {
  relatedEvents: Array<Pick<HydratedEvent, "id" | "title" | "primarySection">>;
}
