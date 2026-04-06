import type {
  AppRouteKey,
  HydratedAlert,
  HydratedEvent,
  HydratedSection,
  SignalLane,
} from "@/types";
import { alerts, events, items, opportunities, sections, sources } from "./dashboard-data";

const sourceMap = new Map(sources.map((source) => [source.id, source]));
const itemMap = new Map(items.map((item) => [item.id, item]));
const eventMap = new Map(events.map((event) => [event.id, event]));
const opportunityMap = new Map(
  opportunities.map((opportunity) => [opportunity.id, opportunity]),
);

function must<T>(value: T | undefined, label: string) {
  if (!value) {
    throw new Error(`Missing mock data for ${label}`);
  }

  return value;
}

function hydrateEvent(eventId: string): HydratedEvent {
  const event = must(eventMap.get(eventId), `event:${eventId}`);

  return {
    ...event,
    canonicalSource: must(
      sourceMap.get(event.canonicalSourceId),
      `source:${event.canonicalSourceId}`,
    ),
    primaryItem: must(itemMap.get(event.primaryItemId), `item:${event.primaryItemId}`),
    supportingItems: event.supportingItemIds.map((itemId) =>
      must(itemMap.get(itemId), `item:${itemId}`),
    ),
    amplificationSources: event.trustedAmplification.map((entry) =>
      must(sourceMap.get(entry.sourceId), `source:${entry.sourceId}`),
    ),
    opportunity: event.opportunityId
      ? must(opportunityMap.get(event.opportunityId), `opportunity:${event.opportunityId}`)
      : undefined,
  };
}

export function getHomepageSections(): HydratedSection[] {
  return sections.map((section) => ({
    ...section,
    events: section.eventIds.map((eventId) => hydrateEvent(eventId)),
  }));
}

function laneMapForRoute(route: AppRouteKey): SignalLane[] {
  switch (route) {
    case "ai":
      return ["ai", "builders"];
    case "quant":
      return ["quant"];
    case "performance":
      return ["performance"];
    default:
      return [];
  }
}

export function getLaneEvents(route: AppRouteKey, limit = 4): HydratedEvent[] {
  const lanes = laneMapForRoute(route);

  return events
    .filter((event) => lanes.includes(event.lane))
    .sort((left, right) => right.score.composite - left.score.composite)
    .slice(0, limit)
    .map((event) => hydrateEvent(event.id));
}

export function getHydratedAlerts(): HydratedAlert[] {
  return alerts.map((alert) => ({
    ...alert,
    relatedEvents: alert.relatedEventIds.map((eventId) => {
      const event = hydrateEvent(eventId);

      return {
        id: event.id,
        title: event.title,
        primarySection: event.primarySection,
      };
    }),
  }));
}

export function getEventCountForRoute(route: AppRouteKey) {
  return getLaneEvents(route, 12).length;
}
