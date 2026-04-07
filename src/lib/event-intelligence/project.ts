import type {
  CanonicalEvent,
  DashboardSectionKey,
  Event,
  EventStatus,
  Item,
  TrustedAmplification,
} from "@/types";

interface ProjectCanonicalEventInput {
  event: CanonicalEvent;
  canonicalSourceId: string;
  primaryItemId: string;
  supportingItemIds: string[];
  trustedAmplification: TrustedAmplification[];
  primarySection: DashboardSectionKey;
  changedSinceLastCycle?: boolean;
  opportunityId?: string;
  score?: Event["score"];
}

function toDashboardStatus(status: CanonicalEvent["status"]): EventStatus {
  return status === "archived" ? "steady" : status;
}

export function projectCanonicalEventToDashboardEvent(
  input: ProjectCanonicalEventInput,
): Event {
  return {
    id: input.event.id,
    lane: input.event.primaryLane,
    primarySection: input.primarySection,
    title: input.event.title,
    summary: input.event.summary ?? "",
    status: toDashboardStatus(input.event.status),
    canonicalSourceId: input.canonicalSourceId,
    primaryItemId: input.primaryItemId,
    supportingItemIds: input.supportingItemIds,
    trustedAmplification: input.trustedAmplification,
    score:
      input.score ?? {
        signal: 0,
        confidence: 0,
        urgency: 0,
        composite: 0,
      },
    tags: input.event.eventTraits,
    updatedAt: input.event.lastMaterialUpdateAt,
    changedSinceLastCycle: input.changedSinceLastCycle ?? false,
    opportunityId: input.opportunityId,
  };
}

export function projectPrimaryRawItemToDashboardItem({
  rawItemId,
  sourceId,
  lane,
  href,
  publishedAt,
  observedAt,
  title,
  summary,
  kind,
  eventId,
  isFirstHand,
}: {
  rawItemId: string;
  sourceId: string;
  lane: Item["lane"];
  href: string;
  publishedAt: string;
  observedAt: string;
  title: string;
  summary: string;
  kind: Item["kind"];
  eventId?: string;
  isFirstHand: boolean;
}): Item {
  return {
    id: rawItemId,
    sourceId,
    kind,
    title,
    summary,
    href,
    publishedAt,
    observedAt,
    lane,
    eventId,
    isFirstHand,
  };
}
