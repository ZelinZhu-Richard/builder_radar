import { extractDomain, normalizeUrl } from "@/lib/intake/normalize/shared";
import type { EventLinkRole } from "@/types";
import type {
  PromotedEventLinkCandidate,
  RawItemLinkRow,
  RawItemRow,
} from "./types";

const SOCIAL_DOMAINS = new Set(["twitter.com", "x.com"]);
const PAPER_DOMAINS = new Set(["arxiv.org", "doi.org", "paperswithcode.com"]);

function isSocialDomain(domain?: string | null) {
  return Boolean(domain && SOCIAL_DOMAINS.has(domain));
}

function looksLikeDocs(url: string, domain?: string | null, title?: string | null) {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = (title ?? "").toLowerCase();

  return (
    lowerUrl.includes("/docs") ||
    lowerUrl.includes("docs.") ||
    lowerTitle.includes("docs") ||
    lowerTitle.includes("documentation") ||
    lowerTitle.includes("release notes")
  );
}

function looksLikeOpportunity(url: string, title?: string | null) {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = (title ?? "").toLowerCase();

  return (
    lowerUrl.includes("apply") ||
    lowerUrl.includes("grant") ||
    lowerUrl.includes("hackathon") ||
    lowerUrl.includes("fellowship") ||
    lowerUrl.includes("jobs") ||
    lowerTitle.includes("apply") ||
    lowerTitle.includes("grant") ||
    lowerTitle.includes("hackathon") ||
    lowerTitle.includes("fellowship") ||
    lowerTitle.includes("internship")
  );
}

function classifyLinkRole(
  rawItem: RawItemRow,
  {
    url,
    domain,
    title,
    rawLinkRole,
    isPrimaryLink,
  }: {
    url: string;
    domain?: string | null;
    title?: string | null;
    rawLinkRole: string;
    isPrimaryLink: boolean;
  },
): EventLinkRole {
  if (domain && PAPER_DOMAINS.has(domain)) {
    return "paper";
  }

  if (domain?.includes("github.com")) {
    return "repo";
  }

  if (
    rawItem.item_kind_hint === "opportunity_page" ||
    looksLikeOpportunity(url, title)
  ) {
    return "opportunity";
  }

  if (
    rawItem.item_kind_hint === "reference_page" ||
    looksLikeDocs(url, domain, title)
  ) {
    return "official_doc";
  }

  if (rawLinkRole === "citation") {
    return "citation";
  }

  if (rawLinkRole === "primary" && isPrimaryLink) {
    return "primary";
  }

  if (rawLinkRole === "evidence") {
    return "evidence";
  }

  return "unknown";
}

function canonicalPriority(role: EventLinkRole) {
  switch (role) {
    case "repo":
    case "paper":
    case "official_doc":
    case "opportunity":
      return true;
    case "primary":
      return true;
    default:
      return false;
  }
}

function uniquePromotedLinks(links: PromotedEventLinkCandidate[]) {
  const seen = new Set<string>();
  const results: PromotedEventLinkCandidate[] = [];

  for (const link of links) {
    const key = `${link.normalizedUrl}|${link.linkRole}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(link);
  }

  return results;
}

export function buildPromotedEventLinks(
  rawItem: RawItemRow,
  rawItemLinks: RawItemLinkRow[],
) {
  const promoted: PromotedEventLinkCandidate[] = [];
  const primaryDomain = extractDomain(rawItem.normalized_url);
  const primaryRole = classifyLinkRole(rawItem, {
    url: rawItem.normalized_url,
    domain: primaryDomain,
    title: rawItem.title,
    rawLinkRole: "primary",
    isPrimaryLink: true,
  });

  promoted.push({
    sourceRawItemId: rawItem.id,
    rawUrl: rawItem.raw_url,
    normalizedUrl: rawItem.normalized_url,
    domain: primaryDomain,
    title: rawItem.title,
    linkRole: primaryRole,
    isCanonical: canonicalPriority(primaryRole),
    reason: "primary_raw_item_url",
  });

  for (const rawLink of rawItemLinks) {
    if (rawLink.link_role === "profile" || rawLink.link_role === "media") {
      continue;
    }

    const normalizedUrl = normalizeUrl(rawLink.normalized_url) ?? rawLink.normalized_url;
    const domain = rawLink.domain ?? extractDomain(normalizedUrl);
    const linkRole = classifyLinkRole(rawItem, {
      url: normalizedUrl,
      domain,
      title: rawLink.title,
      rawLinkRole: rawLink.link_role,
      isPrimaryLink: false,
    });

    if (linkRole === "primary" && isSocialDomain(domain)) {
      continue;
    }

    promoted.push({
      rawItemLinkId: rawLink.id,
      sourceRawItemId: rawItem.id,
      rawUrl: rawLink.raw_url,
      normalizedUrl,
      domain,
      title: rawLink.title,
      linkRole,
      isCanonical: canonicalPriority(linkRole),
      reason: `raw_item_link:${rawLink.link_role}`,
    });
  }

  return uniquePromotedLinks(promoted);
}

export function getHighSignalAnchorLinks(links: PromotedEventLinkCandidate[]) {
  return links.filter((link) => {
    if (isSocialDomain(link.domain)) {
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
