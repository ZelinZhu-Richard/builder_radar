import type { TrustedAccount } from "@/types";
import type { ValidatedXaiXSearchItem } from "@/lib/xai/types";
import type {
  IntakeExecutableQuery,
  IntakeRuntimeConfig,
  NormalizedRawItem,
  ValidatedProviderItem,
} from "../types";
import { buildStoredRawPayload } from "../raw-payload";
import {
  buildLink,
  cleanText,
  computeDedupeKey,
  extractUrlsFromText,
  normalizeHandle,
  normalizeTimestamp,
  normalizeUrl,
  truncateText,
  uniqueLaneHints,
  uniqueLinks,
} from "./shared";

function matchTrustedAccount(
  result: ValidatedXaiXSearchItem,
  trustedAccountsByHandle: Map<string, TrustedAccount>,
) {
  const normalizedHandle = normalizeHandle(result.authorHandle);
  if (!normalizedHandle) {
    return null;
  }

  return trustedAccountsByHandle.get(normalizedHandle) ?? null;
}

export function normalizeXPostResult({
  validatedItem,
  query,
  trustedAccountsByHandle,
  collectedAt,
  config,
}: {
  validatedItem: ValidatedProviderItem<ValidatedXaiXSearchItem>;
  query: IntakeExecutableQuery;
  trustedAccountsByHandle: Map<string, TrustedAccount>;
  collectedAt: Date;
  config: IntakeRuntimeConfig;
}): NormalizedRawItem {
  const { item: result, rawItemJson } = validatedItem;
  const matchedTrustedAccount = matchTrustedAccount(result, trustedAccountsByHandle);
  const normalizedUrl = normalizeUrl(result.permalinkUrl);

  if (!normalizedUrl) {
    throw new Error("X post result is missing a valid permalink URL.");
  }

  const authorNormalizedHandle = normalizeHandle(result.authorHandle);
  const normalizedText = cleanText(result.rawText);
  const publishedAt = normalizeTimestamp(result.publishedAt);
  const laneHints = uniqueLaneHints([
    query.laneHint,
    ...(result.laneHints ?? []),
    ...(matchedTrustedAccount?.laneHints ?? []),
  ]);
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
  const primaryLink = buildLink(result.permalinkUrl, {
    discoveredVia: "provider_field",
    linkRole: "primary",
  });
  const profileLink = buildLink(result.authorProfileUrl, {
    discoveredVia: "provider_field",
    linkRole: "profile",
  });

  return {
    sourceType: "x_post",
    platform: "x",
    externalId: result.externalId || null,
    quotedExternalId: result.quotedPostId || null,
    repliedToExternalId: result.repliedToPostId || null,
    sharedExternalId: result.sharedPostId || null,
    parentThreadExternalId: result.parentThreadId || null,
    dedupeKey: computeDedupeKey({
      sourceType: "x_post",
      externalId: result.externalId || null,
      normalizedUrl,
      normalizedText,
      authorNormalizedHandle,
      publishedAt,
    }),
    matchedTrustedAccountId:
      query.trustedAccountId ?? matchedTrustedAccount?.id ?? null,
    authorHandle: result.authorHandle || null,
    authorNormalizedHandle,
    authorName: cleanText(result.authorName),
    authorUrl: normalizeUrl(result.authorProfileUrl),
    title: truncateText(result.rawText, 120),
    rawText: cleanText(result.rawText),
    normalizedText,
    rawUrl: result.permalinkUrl,
    normalizedUrl,
    publishedAt,
    collectedAt: collectedAt.toISOString(),
    languageCode: null,
    laneHints,
    itemKindHint: "post",
    isFromTrustedAccount:
      Boolean(query.trustedAccountId) || Boolean(matchedTrustedAccount?.id),
    isRepost: result.postType === "repost",
    isQuote: result.postType === "quote",
    isReply: result.postType === "reply",
    rawPayloadJson: buildStoredRawPayload({
      config: config.rawPayload,
      rawItemJson,
      summary: {
        externalId: result.externalId ?? null,
        quotedPostId: result.quotedPostId ?? null,
        repliedToPostId: result.repliedToPostId ?? null,
        sharedPostId: result.sharedPostId ?? null,
        parentThreadId: result.parentThreadId ?? null,
        authorHandle: result.authorHandle ?? null,
        permalinkUrl: result.permalinkUrl,
        publishedAt: result.publishedAt ?? null,
        postType: result.postType,
        linkedUrls: result.linkedUrls,
        laneHints: result.laneHints,
        relevanceNote: cleanText(result.relevanceNote),
      },
    }),
    metadataJson: {
      provider: "xai",
      searchTool: "x_search",
      querySource: query.querySource,
      postType: result.postType,
      quotedPostId: result.quotedPostId ?? null,
      repliedToPostId: result.repliedToPostId ?? null,
      sharedPostId: result.sharedPostId ?? null,
      parentThreadId: result.parentThreadId ?? null,
      relevanceNote: cleanText(result.relevanceNote),
      providerItemIndex: validatedItem.itemIndex,
    },
    extractedLinks: uniqueLinks(
      [primaryLink, profileLink, ...bodyLinks, ...providerLinks].filter(
        (link): link is NonNullable<typeof link> => Boolean(link),
      ),
    ),
  };
}
