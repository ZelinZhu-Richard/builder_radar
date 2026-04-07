import {
  buildEventRefreshResult,
  buildPromotedEventLinks,
  chooseEventMatch,
  getTokenOverlapForEvent,
  isCandidateWithinLookback,
  scoreEventMatch,
} from "../heuristics";
import { getHighSignalAnchorLinks } from "../links";
import { rawItemHasDirectRelationToEvent } from "../relationships";
import { determineSourceRole } from "../source-roles";
import type { Json } from "@/lib/supabase/database.types";
import type {
  CandidateEventContext,
  EventLinkRow,
  EventRawItemRow,
  EventRoleDecision,
  PromotedEventLinkCandidate,
  RawItemRow,
} from "../types";
import type {
  EventIntelligenceEvalItem,
  EventIntelligenceEvalScenario,
} from "./fixtures";

const SOFT_MATCH_LOOKBACK_DAYS = 7;
const LONG_MATCH_LOOKBACK_DAYS = 30;
const BREAKING_WINDOW_HOURS = 24;

function hasAnchorOverlap(
  promotedLinks: PromotedEventLinkCandidate[],
  event: CandidateEventContext,
) {
  const anchorUrls = new Set(
    getHighSignalAnchorLinks(promotedLinks).map((link) => link.normalizedUrl),
  );

  if (anchorUrls.size === 0) {
    return false;
  }

  return event.eventLinks.some((eventLink) => anchorUrls.has(eventLink.normalized_url));
}

function hasLaneOverlap(rawItem: RawItemRow, event: CandidateEventContext) {
  return (
    rawItem.lane_hints.length === 0 ||
    rawItem.lane_hints.some(
      (lane) => event.event.primary_lane === lane || event.event.lane_hints.includes(lane),
    )
  );
}

function selectCandidateEvents(
  item: EventIntelligenceEvalItem,
  contexts: CandidateEventContext[],
) {
  const promotedLinks = buildPromotedEventLinks(item.rawItem, item.rawItemLinks);
  const relationCandidates: CandidateEventContext[] = [];
  const anchorCandidates: CandidateEventContext[] = [];
  const softCandidates: CandidateEventContext[] = [];

  for (const context of contexts) {
    if (rawItemHasDirectRelationToEvent(item.rawItem, context.rawItems)) {
      relationCandidates.push(context);
      continue;
    }

    if (hasAnchorOverlap(promotedLinks, context)) {
      anchorCandidates.push(context);
      continue;
    }

    if (!hasLaneOverlap(item.rawItem, context)) {
      continue;
    }

    if (
      isCandidateWithinLookback({
        rawItem: item.rawItem,
        promotedLinks,
        event: context,
        softMatchLookbackDays: SOFT_MATCH_LOOKBACK_DAYS,
        longMatchLookbackDays: LONG_MATCH_LOOKBACK_DAYS,
      })
    ) {
      softCandidates.push(context);
    }
  }

  return [...relationCandidates, ...anchorCandidates, ...softCandidates];
}

function mergePromotedLinks({
  eventId,
  existingLinks,
  promotedLinks,
}: {
  eventId: string;
  existingLinks: EventLinkRow[];
  promotedLinks: PromotedEventLinkCandidate[];
}) {
  const existingByKey = new Map(
    existingLinks.map((link) => [`${link.normalized_url}|${link.link_role}`, link]),
  );

  for (const promotedLink of promotedLinks) {
    const key = `${promotedLink.normalizedUrl}|${promotedLink.linkRole}`;
    const existing = existingByKey.get(key);

    if (!existing) {
      existingByKey.set(key, {
        id: `${eventId}-link-${existingByKey.size + 1}`,
        event_id: eventId,
        raw_item_link_id: promotedLink.rawItemLinkId ?? null,
        source_raw_item_id: promotedLink.sourceRawItemId,
        raw_url: promotedLink.rawUrl,
        normalized_url: promotedLink.normalizedUrl,
        domain: promotedLink.domain ?? null,
        title: promotedLink.title ?? null,
        link_role: promotedLink.linkRole,
        provenance_count: 1,
        is_canonical: promotedLink.isCanonical,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        metadata_json: {
          reason: promotedLink.reason,
          sourceRawItemIds: [promotedLink.sourceRawItemId],
        },
      });
      continue;
    }

    const existingMetadata =
      typeof existing.metadata_json === "object" &&
      existing.metadata_json !== null &&
      !Array.isArray(existing.metadata_json)
        ? existing.metadata_json
        : {};
    const existingSourceIds = Array.isArray(existingMetadata.sourceRawItemIds)
      ? existingMetadata.sourceRawItemIds
      : [];
    const nextSourceIds = existingSourceIds.includes(promotedLink.sourceRawItemId)
      ? existingSourceIds
      : [...existingSourceIds, promotedLink.sourceRawItemId];

    existingByKey.set(key, {
      ...existing,
      provenance_count:
        existing.provenance_count +
        (existingSourceIds.includes(promotedLink.sourceRawItemId) ? 0 : 1),
      is_canonical: existing.is_canonical || promotedLink.isCanonical,
      title: existing.title ?? promotedLink.title ?? null,
      domain: existing.domain ?? promotedLink.domain ?? null,
      metadata_json: {
        ...(typeof existing.metadata_json === "object" && existing.metadata_json
          ? existing.metadata_json
          : {}),
        sourceRawItemIds: nextSourceIds,
      },
    });
  }

  return Array.from(existingByKey.values());
}

function roleMapFromMemberships(memberships: EventRawItemRow[]) {
  return new Map<string, EventRoleDecision>(
    memberships.map((membership) => [
      membership.raw_item_id,
      {
        sourceRole: membership.source_role as EventRoleDecision["sourceRole"],
        isMaterialUpdate: membership.is_material_update,
        isLowValue: membership.source_role === "low_value_repetition",
        reasonSummary: membership.reason_summary ?? "",
      },
    ]),
  );
}

function toPromotedLinks(eventLinks: EventLinkRow[]): PromotedEventLinkCandidate[] {
  return eventLinks.map((link) => ({
    rawItemLinkId: link.raw_item_link_id,
    sourceRawItemId: link.source_raw_item_id ?? "",
    rawUrl: link.raw_url,
    normalizedUrl: link.normalized_url,
    domain: link.domain,
    title: link.title,
    linkRole: link.link_role as PromotedEventLinkCandidate["linkRole"],
    isCanonical: link.is_canonical,
    reason: "event_link",
  }));
}

function refreshContext(
  context: CandidateEventContext,
  latestAssignmentMethod:
    | "existing_membership"
    | "exact_anchor_link"
    | "stable_key"
    | "soft_match"
    | "new_event",
) {
  const refresh = buildEventRefreshResult({
    existingEvent: context.event,
    rawItems: context.rawItems,
    roleByRawItemId: roleMapFromMemberships(context.memberships),
    promotedLinks: toPromotedLinks(context.eventLinks),
    now: new Date("2026-04-06T20:00:00.000Z"),
    breakingWindowHours: BREAKING_WINDOW_HOURS,
    latestAssignmentMethod,
  });

  context.event = {
    ...context.event,
    stable_key: refresh.stableKey,
    title: refresh.title,
    summary: refresh.summary,
    primary_lane: refresh.primaryLane,
    lane_hints: refresh.laneHints,
    event_traits: refresh.eventTraits,
    event_kind_hint: refresh.eventKindHint,
    status: refresh.status,
    primary_raw_item_id: refresh.primaryRawItemId,
    primary_source_role: refresh.primarySourceRole,
    latest_seen_at: refresh.latestSeenAt,
    last_material_update_at: refresh.lastMaterialUpdateAt,
    member_count: refresh.memberCount,
    material_update_count: refresh.materialUpdateCount,
    cluster_explanation_json: refresh.clusterExplanationJson as Json,
    metadata_json: refresh.metadataJson as Json,
  };
  context.memberships = context.memberships.map((membership) => ({
    ...membership,
    is_primary: membership.raw_item_id === refresh.primaryRawItemId,
  }));
}

function buildNewEventContext(
  eventId: string,
  item: EventIntelligenceEvalItem,
  roleDecision: EventRoleDecision,
) {
  const promotedLinks = buildPromotedEventLinks(item.rawItem, item.rawItemLinks);
  const membership: EventRawItemRow = {
    id: `${eventId}-membership-1`,
    event_id: eventId,
    raw_item_id: item.rawItem.id,
    source_role: roleDecision.sourceRole,
    is_primary: true,
    is_material_update: roleDecision.isMaterialUpdate,
    assignment_method: "new_event",
    assignment_score: 100,
    reason_summary: roleDecision.reasonSummary,
    metadata_json: {},
    first_attached_at: item.rawItem.collected_at,
    updated_at: item.rawItem.collected_at,
  };
  const context: CandidateEventContext = {
    event: {
      id: eventId,
      stable_key: null,
      title: item.rawItem.title ?? "Untitled event",
      summary: item.rawItem.raw_text ?? null,
      primary_lane: (item.rawItem.lane_hints[0] ?? "ai"),
      lane_hints: item.rawItem.lane_hints,
      event_traits: [],
      event_kind_hint: item.rawItem.item_kind_hint,
      status: "new",
      primary_raw_item_id: item.rawItem.id,
      primary_source_role: roleDecision.sourceRole,
      first_seen_at: item.rawItem.collected_at,
      latest_seen_at: item.rawItem.collected_at,
      last_material_update_at: item.rawItem.published_at ?? item.rawItem.collected_at,
      member_count: 1,
      material_update_count: roleDecision.isMaterialUpdate ? 1 : 1,
      merged_into_event_id: null,
      primary_raw_item_override_id: null,
      cluster_explanation_json: {},
      metadata_json: {},
      created_at: item.rawItem.collected_at,
      updated_at: item.rawItem.collected_at,
    },
    primaryRawItem: item.rawItem,
    memberships: [membership],
    rawItems: [item.rawItem],
    eventLinks: mergePromotedLinks({
      eventId,
      existingLinks: [],
      promotedLinks,
    }),
  };

  refreshContext(context, "new_event");
  context.primaryRawItem =
    context.rawItems.find((rawItem) => rawItem.id === context.event.primary_raw_item_id) ?? null;

  return context;
}

export function replayEventIntelligenceScenario(
  scenario: EventIntelligenceEvalScenario,
) {
  const contexts = new Map<string, CandidateEventContext>();
  const membershipByRawItemId = new Map<string, EventRawItemRow>();
  let eventCounter = 0;

  for (const item of scenario.items) {
    const promotedLinks = buildPromotedEventLinks(item.rawItem, item.rawItemLinks);
    const candidateEvents = selectCandidateEvents(item, Array.from(contexts.values()));
    const matches = candidateEvents.map((context) =>
      scoreEventMatch({
        rawItem: item.rawItem,
        promotedLinks,
        event: context,
      }),
    );
    const decision = chooseEventMatch(matches);

    if (decision.matchedEventId) {
      const context = contexts.get(decision.matchedEventId);

      if (!context) {
        throw new Error(`Missing event context for ${decision.matchedEventId}.`);
      }

      const tokenOverlap = getTokenOverlapForEvent(item.rawItem, context);
      const roleDecision = determineSourceRole({
        rawItem: item.rawItem,
        event: context,
        promotedLinks,
        tokenOverlap,
      });

      const membership: EventRawItemRow = {
        id: `${context.event.id}-membership-${context.memberships.length + 1}`,
        event_id: context.event.id,
        raw_item_id: item.rawItem.id,
        source_role: roleDecision.sourceRole,
        is_primary: false,
        is_material_update: roleDecision.isMaterialUpdate,
        assignment_method: decision.method,
        assignment_score: decision.score,
        reason_summary: roleDecision.reasonSummary,
        metadata_json: {},
        first_attached_at: item.rawItem.collected_at,
        updated_at: item.rawItem.collected_at,
      };

      context.rawItems.push(item.rawItem);
      context.memberships.push(membership);
      context.eventLinks = mergePromotedLinks({
        eventId: context.event.id,
        existingLinks: context.eventLinks,
        promotedLinks,
      });
      refreshContext(context, decision.method);
      context.primaryRawItem =
        context.rawItems.find((rawItem) => rawItem.id === context.event.primary_raw_item_id) ?? null;
      membershipByRawItemId.set(item.rawItem.id, membership);
      continue;
    }

    const roleDecision = determineSourceRole({
      rawItem: item.rawItem,
      promotedLinks,
      tokenOverlap: 0,
    });
    const eventId = `event-${++eventCounter}`;
    const context = buildNewEventContext(eventId, item, roleDecision);
    contexts.set(eventId, context);
    membershipByRawItemId.set(item.rawItem.id, context.memberships[0]!);
  }

  return {
    contexts: Array.from(contexts.values()),
    membershipByRawItemId,
  };
}
