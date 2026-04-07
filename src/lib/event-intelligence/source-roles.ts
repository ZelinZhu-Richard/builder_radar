import type { EventSourceRole } from "@/types";
import type {
  CandidateEventContext,
  EventRoleDecision,
  PromotedEventLinkCandidate,
  RawItemRow,
} from "./types";
import { rawItemHasDirectRelationToEvent } from "./relationships";

function hasNewMeaningfulLink(
  promotedLinks: PromotedEventLinkCandidate[],
  existingUrls: Set<string>,
) {
  return promotedLinks.some((link) => {
    if (existingUrls.has(link.normalizedUrl)) {
      return false;
    }

    return (
      link.linkRole === "official_doc" ||
      link.linkRole === "repo" ||
      link.linkRole === "paper" ||
      link.linkRole === "opportunity" ||
      link.linkRole === "evidence" ||
      link.linkRole === "citation"
    );
  });
}

export function getSourceRolePrecedence(role: EventSourceRole) {
  switch (role) {
    case "primary_source":
      return 5;
    case "direct_participant":
      return 4;
    case "trusted_amplification":
      return 3;
    case "commentary":
      return 2;
    case "low_value_repetition":
      return 1;
  }
}

export function determineSourceRole({
  rawItem,
  event,
  promotedLinks,
  tokenOverlap,
}: {
  rawItem: RawItemRow;
  event?: CandidateEventContext | null;
  promotedLinks: PromotedEventLinkCandidate[];
  tokenOverlap: number;
}): EventRoleDecision {
  const primaryRawItem = event?.primaryRawItem ?? null;
  const existingUrls = new Set(event?.eventLinks.map((link) => link.normalized_url) ?? []);
  const hasCanonicalLink = promotedLinks.some(
    (link) =>
      link.linkRole === "official_doc" ||
      link.linkRole === "repo" ||
      link.linkRole === "paper" ||
      link.linkRole === "opportunity",
  );
  const newMeaningfulLink = hasNewMeaningfulLink(promotedLinks, existingUrls);
  const samePrimaryHandle =
    Boolean(
      rawItem.author_normalized_handle &&
        primaryRawItem?.author_normalized_handle &&
        rawItem.author_normalized_handle === primaryRawItem.author_normalized_handle,
    ) ||
    Boolean(
      rawItem.matched_trusted_account_id &&
        primaryRawItem?.matched_trusted_account_id &&
        rawItem.matched_trusted_account_id === primaryRawItem.matched_trusted_account_id,
    );
  const hasDirectRelation = event
    ? rawItemHasDirectRelationToEvent(rawItem, event.rawItems)
    : false;

  if (
    rawItem.platform === "web" &&
    hasCanonicalLink
  ) {
    return {
      sourceRole: "primary_source",
      isMaterialUpdate: true,
      isLowValue: false,
      reasonSummary: "Official or canonical web artifact for the event.",
    };
  }

  if (
    rawItem.platform === "x" &&
    rawItem.is_from_trusted_account &&
    !rawItem.is_repost &&
    !rawItem.is_quote &&
    !rawItem.is_reply
  ) {
    return {
      sourceRole: "primary_source",
      isMaterialUpdate: true,
      isLowValue: false,
      reasonSummary: "First-hand trusted account post.",
    };
  }

  if (rawItem.is_repost || rawItem.is_quote) {
    return {
      sourceRole: rawItem.is_from_trusted_account
        ? "trusted_amplification"
        : "low_value_repetition",
      isMaterialUpdate: newMeaningfulLink,
      isLowValue: !rawItem.is_from_trusted_account,
      reasonSummary: rawItem.is_from_trusted_account
        ? "Trusted repost or quote that amplifies an existing event."
        : "Non-primary repost or quote with weak standalone value.",
    };
  }

  if (
    samePrimaryHandle ||
    hasDirectRelation ||
    (rawItem.is_reply && rawItem.is_from_trusted_account)
  ) {
    return {
      sourceRole: "direct_participant",
      isMaterialUpdate: true,
      isLowValue: false,
      reasonSummary: hasDirectRelation
        ? "Direct participant follow-up with explicit thread or reply linkage."
        : "Direct participant follow-up or same-actor thread.",
    };
  }

  if (rawItem.is_from_trusted_account) {
    return {
      sourceRole: "trusted_amplification",
      isMaterialUpdate: newMeaningfulLink,
      isLowValue: false,
      reasonSummary: "Trusted account commentary or confirmation.",
    };
  }

  if (newMeaningfulLink || hasCanonicalLink) {
    return {
      sourceRole: "commentary",
      isMaterialUpdate: newMeaningfulLink,
      isLowValue: false,
      reasonSummary: "Supporting commentary with new evidence or links.",
    };
  }

  if (tokenOverlap >= 0.65) {
    return {
      sourceRole: "low_value_repetition",
      isMaterialUpdate: false,
      isLowValue: true,
      reasonSummary: "Repetitive commentary without new evidence.",
    };
  }

  return {
    sourceRole: "commentary",
    isMaterialUpdate: false,
    isLowValue: false,
    reasonSummary: "Supporting commentary related to the event.",
  };
}
