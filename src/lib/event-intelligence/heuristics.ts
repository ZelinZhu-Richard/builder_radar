import { truncateText } from "@/lib/intake/normalize/shared";
import type {
  EventAssignmentMethod,
  EventStatus,
  EventTrait,
  SignalLane,
} from "@/types";
import { buildPromotedEventLinks, getHighSignalAnchorLinks } from "./links";
import { rawItemHasDirectRelationToEvent } from "./relationships";
import { getSourceRolePrecedence } from "./source-roles";
import { buildTokenSignature, computeTokenOverlap } from "./token-signature";
import type {
  CandidateEventContext,
  EventMatchCandidate,
  EventMatchDecision,
  EventRefreshResult,
  EventRoleDecision,
  PromotedEventLinkCandidate,
  RawItemRow,
} from "./types";

function toTimestamp(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function toDomain(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLongWindowItem(rawItem: RawItemRow, promotedLinks: PromotedEventLinkCandidate[]) {
  return (
    rawItem.item_kind_hint === "repo" ||
    rawItem.item_kind_hint === "reference_page" ||
    rawItem.item_kind_hint === "opportunity_page" ||
    promotedLinks.some((link) =>
      link.linkRole === "repo" ||
      link.linkRole === "official_doc" ||
      link.linkRole === "paper" ||
      link.linkRole === "opportunity",
    )
  );
}

export function isCandidateWithinLookback({
  rawItem,
  promotedLinks,
  event,
  softMatchLookbackDays,
  longMatchLookbackDays,
}: {
  rawItem: RawItemRow;
  promotedLinks: PromotedEventLinkCandidate[];
  event: CandidateEventContext;
  softMatchLookbackDays: number;
  longMatchLookbackDays: number;
}) {
  const rawPublishedAt = toTimestamp(rawItem.published_at ?? rawItem.collected_at);
  const latestSeenAt = toTimestamp(event.event.latest_seen_at);
  const lookbackDays = isLongWindowItem(rawItem, promotedLinks)
    ? longMatchLookbackDays
    : softMatchLookbackDays;

  return Math.abs(rawPublishedAt - latestSeenAt) <= lookbackDays * 24 * 60 * 60 * 1000;
}

export function computeStableKey({
  primaryRawItem,
  primarySourceRole,
  promotedLinks,
}: {
  primaryRawItem: RawItemRow;
  primarySourceRole: EventRoleDecision["sourceRole"];
  promotedLinks: PromotedEventLinkCandidate[];
}) {
  const canonicalLink = getHighSignalAnchorLinks(promotedLinks)[0] ?? promotedLinks[0] ?? null;

  if (canonicalLink) {
    return `link:${canonicalLink.linkRole}:${canonicalLink.normalizedUrl}`;
  }

  if (
    primaryRawItem.external_id &&
    (primarySourceRole === "primary_source" ||
      primarySourceRole === "direct_participant") &&
    !primaryRawItem.is_repost &&
    !primaryRawItem.is_quote &&
    !primaryRawItem.is_reply
  ) {
    return `raw:${primaryRawItem.platform}:${primaryRawItem.external_id}`;
  }

  return null;
}

function laneOverlapScore(rawItem: RawItemRow, event: CandidateEventContext) {
  const left = new Set(rawItem.lane_hints);
  const right = new Set(event.event.lane_hints);

  for (const lane of left) {
    if (right.has(lane)) {
      return 10;
    }
  }

  return 0;
}

function itemKindOrDomainScore(rawItem: RawItemRow, event: CandidateEventContext) {
  if (
    rawItem.item_kind_hint &&
    event.event.event_kind_hint &&
    rawItem.item_kind_hint === event.event.event_kind_hint
  ) {
    return 15;
  }

  const rawDomain = toDomain(rawItem.normalized_url);
  const eventDomain = event.primaryRawItem
    ? toDomain(event.primaryRawItem.normalized_url)
    : null;

  return rawDomain && eventDomain && rawDomain === eventDomain ? 15 : 0;
}

function timeWindowScore(rawItem: RawItemRow, event: CandidateEventContext) {
  const rawPublishedAt = toTimestamp(rawItem.published_at ?? rawItem.collected_at);
  const eventLastMaterialUpdate = toTimestamp(event.event.last_material_update_at);
  const difference = Math.abs(rawPublishedAt - eventLastMaterialUpdate);

  return difference <= 48 * 60 * 60 * 1000 ? 10 : 0;
}

function conflictingPrimaryLinkPenalty(
  promotedLinks: PromotedEventLinkCandidate[],
  event: CandidateEventContext,
) {
  const candidateLink = getHighSignalAnchorLinks(promotedLinks)[0] ?? null;
  const eventLink = event.eventLinks.find((link) => link.is_canonical) ?? null;

  if (
    candidateLink &&
    eventLink &&
    candidateLink.normalizedUrl !== eventLink.normalized_url
  ) {
    return -25;
  }

  return 0;
}

export function scoreEventMatch({
  rawItem,
  promotedLinks,
  event,
}: {
  rawItem: RawItemRow;
  promotedLinks: PromotedEventLinkCandidate[];
  event: CandidateEventContext;
}): EventMatchCandidate {
  const reasons: string[] = [];
  let score = 0;
  let method: EventAssignmentMethod = "soft_match";
  const anchorLinks = getHighSignalAnchorLinks(promotedLinks);
  const eventLinkSet = new Set(
    event.eventLinks
      .filter((link) =>
        link.link_role === "official_doc" ||
        link.link_role === "repo" ||
        link.link_role === "paper" ||
        link.link_role === "opportunity" ||
        link.link_role === "evidence" ||
        link.link_role === "citation",
      )
      .map((link) => link.normalized_url),
  );
  const hasDirectRelation = rawItemHasDirectRelationToEvent(rawItem, event.rawItems);

  if (anchorLinks.some((link) => eventLinkSet.has(link.normalizedUrl))) {
    score += 100;
    method = "exact_anchor_link";
    reasons.push("exact_anchor_link");
  }

  const stableKey = computeStableKey({
    primaryRawItem: rawItem,
    primarySourceRole: rawItem.is_from_trusted_account &&
      !rawItem.is_repost &&
      !rawItem.is_quote &&
      !rawItem.is_reply
        ? "primary_source"
        : "commentary",
    promotedLinks,
  });

  if (stableKey && event.event.stable_key === stableKey) {
    score += 100;
    method = method === "exact_anchor_link" ? method : "stable_key";
    reasons.push("stable_key_match");
  }

  if (hasDirectRelation) {
    score += 90;
    reasons.push("relation_id_match");
  }

  if (
    rawItem.matched_trusted_account_id &&
    event.primaryRawItem?.matched_trusted_account_id &&
    rawItem.matched_trusted_account_id === event.primaryRawItem.matched_trusted_account_id
  ) {
    score += 35;
    reasons.push("same_trusted_account");
  } else if (
    rawItem.author_normalized_handle &&
    event.primaryRawItem?.author_normalized_handle &&
    rawItem.author_normalized_handle === event.primaryRawItem.author_normalized_handle
  ) {
    score += 35;
    reasons.push("same_author_handle");
  }

  const rawSignature = buildTokenSignature([
    rawItem.title,
    rawItem.normalized_text,
    rawItem.raw_text,
  ]);
  const eventSignature = buildTokenSignature([
    event.event.title,
    event.primaryRawItem?.normalized_text,
    event.primaryRawItem?.raw_text,
  ]);
  const overlap = computeTokenOverlap(rawSignature.tokens, eventSignature.tokens);

  if (overlap >= 0.5) {
    score += 25;
    reasons.push("strong_token_overlap");
  }

  const domainOrKind = itemKindOrDomainScore(rawItem, event);
  if (domainOrKind > 0) {
    score += domainOrKind;
    reasons.push("kind_or_domain_match");
  }

  const laneScore = laneOverlapScore(rawItem, event);
  if (laneScore > 0) {
    score += laneScore;
    reasons.push("lane_overlap");
  }

  const recentScore = timeWindowScore(rawItem, event);
  if (recentScore > 0) {
    score += recentScore;
    reasons.push("recent_material_window");
  }

  const primaryPenalty = conflictingPrimaryLinkPenalty(promotedLinks, event);
  if (primaryPenalty < 0) {
    score += primaryPenalty;
    reasons.push("conflicting_primary_link");
  }

  if (
    overlap >= 0.3 &&
    reasons.length === 1 &&
    reasons[0] === "strong_token_overlap"
  ) {
    score -= 20;
    reasons.push("weak_commentary_resemblance");
  }

  return {
    eventId: event.event.id,
    method,
    score,
    reasons,
  };
}

export function chooseEventMatch(matches: EventMatchCandidate[]): EventMatchDecision {
  const sorted = [...matches].sort((left, right) => right.score - left.score);
  const top = sorted[0];
  const runnerUp = sorted[1];

  if (!top) {
    return {
      matchedEventId: null,
      method: "new_event",
      score: 0,
      reasons: [],
      runnerUpEventId: null,
      runnerUpScore: 0,
      ambiguityFlag: false,
      ambiguityReason: null,
    };
  }

  const scoreMargin = top.score - (runnerUp?.score ?? 0);
  const belowThreshold = top.score < 80;
  const lowMargin = scoreMargin < 20;

  if (!belowThreshold && !lowMargin) {
    return {
      matchedEventId: top.eventId,
      method: top.method,
      score: top.score,
      reasons: top.reasons,
      runnerUpEventId: runnerUp?.eventId ?? null,
      runnerUpScore: runnerUp?.score ?? 0,
      ambiguityFlag: false,
      ambiguityReason: null,
    };
  }

  const ambiguityReason =
    top.reasons.includes("conflicting_primary_link")
      ? "conflicting_anchor"
      : belowThreshold
        ? "below_threshold"
        : lowMargin
          ? "low_margin"
          : null;

  if (ambiguityReason) {
    return {
      matchedEventId: null,
      method: "new_event",
      score: top.score,
      reasons: top.reasons,
      runnerUpEventId: runnerUp?.eventId ?? null,
      runnerUpScore: runnerUp?.score ?? 0,
      ambiguityFlag: true,
      ambiguityReason,
    };
  }

  return {
    matchedEventId: null,
    method: "new_event",
    score: top.score,
    reasons: top.reasons,
    runnerUpEventId: runnerUp?.eventId ?? null,
    runnerUpScore: runnerUp?.score ?? 0,
    ambiguityFlag: false,
    ambiguityReason: null,
  };
}

export function choosePrimaryMembership({
  rawItems,
  roleByRawItemId,
  primaryRawItemOverrideId,
}: {
  rawItems: RawItemRow[];
  roleByRawItemId: Map<string, EventRoleDecision>;
  primaryRawItemOverrideId?: string | null;
}) {
  if (primaryRawItemOverrideId) {
    const overriddenItem =
      rawItems.find((rawItem) => rawItem.id === primaryRawItemOverrideId) ?? null;

    if (overriddenItem) {
      return overriddenItem;
    }
  }

  const sorted = [...rawItems].sort((left, right) => {
    const leftRole = roleByRawItemId.get(left.id)?.sourceRole ?? "low_value_repetition";
    const rightRole = roleByRawItemId.get(right.id)?.sourceRole ?? "low_value_repetition";
    const precedenceDelta =
      getSourceRolePrecedence(rightRole) - getSourceRolePrecedence(leftRole);

    if (precedenceDelta !== 0) {
      return precedenceDelta;
    }

    const leftArtifactPreference = canonicalArtifactTieBreaker(left);
    const rightArtifactPreference = canonicalArtifactTieBreaker(right);
    if (rightArtifactPreference !== leftArtifactPreference) {
      return rightArtifactPreference - leftArtifactPreference;
    }

    const leftDirectness = Number(!left.is_repost && !left.is_quote && !left.is_reply);
    const rightDirectness = Number(!right.is_repost && !right.is_quote && !right.is_reply);
    if (rightDirectness !== leftDirectness) {
      return rightDirectness - leftDirectness;
    }

    return toTimestamp(right.published_at ?? right.collected_at) -
      toTimestamp(left.published_at ?? left.collected_at);
  });

  return sorted[0] ?? null;
}

function canonicalArtifactTieBreaker(rawItem: RawItemRow) {
  if (
    rawItem.platform === "web" &&
    (rawItem.item_kind_hint === "reference_page" ||
      rawItem.item_kind_hint === "opportunity_page" ||
      rawItem.item_kind_hint === "repo")
  ) {
    return 1;
  }

  return 0;
}

function derivePrimaryLane(rawItems: RawItemRow[]) {
  const counts = new Map<SignalLane, number>();

  for (const rawItem of rawItems) {
    for (const lane of rawItem.lane_hints as SignalLane[]) {
      counts.set(lane, (counts.get(lane) ?? 0) + 1);
    }
  }

  return (
    Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "ai"
  );
}

function deriveTraits({
  rawItems,
  roleByRawItemId,
  breakingWindowHours,
  now,
}: {
  rawItems: RawItemRow[];
  roleByRawItemId: Map<string, EventRoleDecision>;
  breakingWindowHours: number;
  now: Date;
}) {
  const traits = new Set<EventTrait>();

  for (const rawItem of rawItems) {
    const role = roleByRawItemId.get(rawItem.id)?.sourceRole;
    if (role === "primary_source" || role === "direct_participant") {
      traits.add("first_hand");
    }

    const titleText = `${rawItem.title ?? ""} ${rawItem.raw_text ?? ""}`.toLowerCase();
    if (rawItem.item_kind_hint === "opportunity_page" || titleText.includes("apply")) {
      traits.add("opportunity");
    }

    if (
      titleText.includes("workflow") ||
      titleText.includes("guide") ||
      titleText.includes("playbook")
    ) {
      traits.add("workflow");
    }

    const publishedAt = toTimestamp(rawItem.published_at ?? rawItem.collected_at);
    if (
      publishedAt > 0 &&
      now.getTime() - publishedAt <= breakingWindowHours * 60 * 60 * 1000 &&
      (role === "primary_source" || role === "direct_participant")
    ) {
      traits.add("breaking");
    }
  }

  return Array.from(traits);
}

function deriveStatus({
  firstSeenAt,
  latestSeenAt,
  materialUpdateCount,
}: {
  firstSeenAt: string;
  latestSeenAt: string;
  materialUpdateCount: number;
}): EventStatus {
  const firstSeen = toTimestamp(firstSeenAt);
  const latestSeen = toTimestamp(latestSeenAt);
  const ageDays = (latestSeen - firstSeen) / (24 * 60 * 60 * 1000);

  if (ageDays >= 45) {
    return "archived";
  }

  if (materialUpdateCount <= 1) {
    return "new";
  }

  if (ageDays <= 7) {
    return "developing";
  }

  return "steady";
}

function deriveSummary(rawItem: RawItemRow) {
  return truncateText(rawItem.raw_text ?? rawItem.title ?? null, 220);
}

export function buildEventRefreshResult({
  existingEvent,
  rawItems,
  roleByRawItemId,
  promotedLinks,
  now,
  breakingWindowHours,
  latestAssignmentMethod,
}: {
  existingEvent?: CandidateEventContext["event"] | null;
  rawItems: RawItemRow[];
  roleByRawItemId: Map<string, EventRoleDecision>;
  promotedLinks: PromotedEventLinkCandidate[];
  now: Date;
  breakingWindowHours: number;
  latestAssignmentMethod: EventAssignmentMethod;
}): EventRefreshResult {
  const primaryRawItem = choosePrimaryMembership({
    rawItems,
    roleByRawItemId,
    primaryRawItemOverrideId: existingEvent?.primary_raw_item_override_id ?? null,
  });

  if (!primaryRawItem) {
    throw new Error("Cannot refresh event without any member raw items.");
  }

  const primaryRole = roleByRawItemId.get(primaryRawItem.id)?.sourceRole ?? "commentary";
  const firstSeenAt =
    existingEvent?.first_seen_at ??
    rawItems
      .map((item) => item.collected_at)
      .sort((left, right) => left.localeCompare(right))[0] ??
    now.toISOString();
  const latestSeenAt =
    rawItems
      .map((item) => item.collected_at)
      .sort((left, right) => right.localeCompare(left))[0] ?? now.toISOString();
  const materialUpdates = rawItems.filter(
    (item) => roleByRawItemId.get(item.id)?.isMaterialUpdate,
  );
  const lastMaterialUpdateAt =
    materialUpdates
      .map((item) => item.published_at ?? item.collected_at)
      .sort((left, right) => right.localeCompare(left))[0] ?? latestSeenAt;
  const laneHints = Array.from(
    new Set(rawItems.flatMap((item) => item.lane_hints as SignalLane[])),
  );
  const primaryLane = derivePrimaryLane(rawItems);
  const traits = deriveTraits({
    rawItems,
    roleByRawItemId,
    breakingWindowHours,
    now,
  });
  const canonicalLinks = promotedLinks.filter((link) => link.isCanonical);
  const summary = deriveSummary(primaryRawItem);
  const stableKey = computeStableKey({
    primaryRawItem,
    primarySourceRole: primaryRole,
    promotedLinks,
  });

  return {
    primaryRawItemId: primaryRawItem.id,
    primarySourceRole: primaryRole,
    title: primaryRawItem.title ?? truncateText(primaryRawItem.raw_text, 120) ?? "Untitled event",
    summary,
    primaryLane,
    laneHints,
    eventTraits: traits,
    eventKindHint: primaryRawItem.item_kind_hint,
    status: deriveStatus({
      firstSeenAt,
      latestSeenAt,
      materialUpdateCount: materialUpdates.length,
    }),
    latestSeenAt,
    lastMaterialUpdateAt,
    memberCount: rawItems.length,
    materialUpdateCount: Math.max(materialUpdates.length, 1),
    stableKey,
    clusterExplanationJson: {
      latestAssignmentMethod,
      primaryRawItemId: primaryRawItem.id,
      primarySourceRole: primaryRole,
      canonicalLinkCount: canonicalLinks.length,
      stableKey,
    },
    metadataJson: {
      primaryRawItemPlatform: primaryRawItem.platform,
      roleCounts: Array.from(roleByRawItemId.values()).reduce<Record<string, number>>(
        (accumulator, roleDecision) => {
          accumulator[roleDecision.sourceRole] =
            (accumulator[roleDecision.sourceRole] ?? 0) + 1;
          return accumulator;
        },
        {},
      ),
      tokenSignatureHash: buildTokenSignature([
        primaryRawItem.title,
        primaryRawItem.normalized_text,
      ]).hash,
    },
  };
}

export function getTokenOverlapForEvent(
  rawItem: RawItemRow,
  event: CandidateEventContext,
) {
  return computeTokenOverlap(
    buildTokenSignature([rawItem.title, rawItem.normalized_text, rawItem.raw_text]).tokens,
    buildTokenSignature([
      event.event.title,
      event.primaryRawItem?.normalized_text,
      event.primaryRawItem?.raw_text,
    ]).tokens,
  );
}

export { buildPromotedEventLinks };
