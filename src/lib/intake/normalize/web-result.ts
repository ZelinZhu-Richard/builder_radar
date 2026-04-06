import type { ValidatedXaiWebSearchItem } from "@/lib/xai/types";
import type {
  IntakeExecutableQuery,
  NormalizedRawItem,
  ValidatedProviderItem,
} from "../types";
import {
  buildLink,
  cleanText,
  computeDedupeKey,
  extractUrlsFromText,
  normalizeTimestamp,
  normalizeUrl,
  uniqueLaneHints,
  uniqueLinks,
} from "./shared";

function inferItemKindHint(result: ValidatedXaiWebSearchItem) {
  const lowerTitle = (result.title ?? "").toLowerCase();
  const lowerUrl = result.url.toLowerCase();

  if (lowerUrl.includes("github.com")) {
    return "repo";
  }

  if (
    lowerTitle.includes("grant") ||
    lowerTitle.includes("fellowship") ||
    lowerTitle.includes("hackathon") ||
    lowerTitle.includes("apply") ||
    lowerTitle.includes("program")
  ) {
    return "opportunity_page";
  }

  if (lowerTitle.includes("release") || lowerTitle.includes("docs")) {
    return "reference_page";
  }

  return "article";
}

export function normalizeWebResult({
  validatedItem,
  query,
  collectedAt,
}: {
  validatedItem: ValidatedProviderItem<ValidatedXaiWebSearchItem>;
  query: IntakeExecutableQuery;
  collectedAt: Date;
}): NormalizedRawItem {
  const { item: result, rawItemJson } = validatedItem;
  const normalizedUrl = normalizeUrl(result.url);

  if (!normalizedUrl) {
    throw new Error("Web search result is missing a valid URL.");
  }

  const normalizedText = cleanText(result.rawText);
  const publishedAt = normalizeTimestamp(result.publishedAt);
  const laneHints = uniqueLaneHints([query.laneHint, ...(result.laneHints ?? [])]);
  const bodyLinks = extractUrlsFromText(result.rawText).map((url, index) =>
    buildLink(url, {
      discoveredVia: "body",
      linkRole: "evidence",
      position: index,
    }),
  );
  const providerLinks = result.linkedUrls.map((url, index) =>
    buildLink(url, {
      discoveredVia: "provider_field",
      linkRole: "evidence",
      position: index,
    }),
  );
  const primaryLink = buildLink(result.url, {
    discoveredVia: "web_result",
    linkRole: "primary",
    title: cleanText(result.title),
  });

  return {
    sourceType: "web_result",
    platform: "web",
    externalId: null,
    dedupeKey: computeDedupeKey({
      sourceType: "web_result",
      normalizedUrl,
      normalizedText,
      publishedAt,
    }),
    matchedTrustedAccountId: null,
    authorHandle: null,
    authorNormalizedHandle: null,
    authorName: null,
    authorUrl: null,
    title: cleanText(result.title),
    rawText: cleanText(result.rawText),
    normalizedText,
    rawUrl: result.url,
    normalizedUrl,
    publishedAt,
    collectedAt: collectedAt.toISOString(),
    languageCode: null,
    laneHints,
    itemKindHint: inferItemKindHint(result),
    isFromTrustedAccount: false,
    isRepost: false,
    isQuote: false,
    isReply: false,
    rawPayloadJson: rawItemJson,
    metadataJson: {
      provider: "xai",
      searchTool: "web_search",
      querySource: query.querySource,
      sourceName: cleanText(result.sourceName),
      relevanceNote: cleanText(result.relevanceNote),
      domain: result.domain,
      providerItemIndex: validatedItem.itemIndex,
    },
    extractedLinks: uniqueLinks(
      [primaryLink, ...bodyLinks, ...providerLinks].filter(
        (link): link is NonNullable<typeof link> => Boolean(link),
      ),
    ),
  };
}
