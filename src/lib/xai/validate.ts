import type { SignalLane } from "@/types";
import type { IntakeIssueNote } from "@/types";
import type { ValidatedProviderResult } from "@/lib/intake/types";
import type { XaiProviderResult } from "@/lib/xai/types";
import type {
  ValidatedXaiWebSearchItem,
  ValidatedXaiXSearchItem,
  XaiPostType,
} from "./types";
import { normalizeTimestamp, normalizeUrl } from "@/lib/intake/normalize/shared";

const VALID_POST_TYPES = new Set<XaiPostType>([
  "original",
  "repost",
  "quote",
  "reply",
]);

const VALID_LANES = new Set<SignalLane>([
  "ai",
  "builders",
  "quant",
  "performance",
]);

function buildIssue(
  code: IntakeIssueNote["code"],
  message: string,
  itemIndex: number,
  field?: string | null,
): IntakeIssueNote {
  return {
    code,
    message,
    itemIndex,
    field: field ?? null,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function asOptionalTimestamp(value: unknown) {
  const normalized = asOptionalString(value);
  return normalizeTimestamp(normalized);
}

function asOptionalValidUrl(value: unknown) {
  const normalized = asOptionalString(value);
  if (!normalized) {
    return null;
  }

  return normalizeUrl(normalized) ? normalized : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => asOptionalString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function sanitizeLinkedUrls(value: unknown) {
  return asStringArray(value).filter((entry) => Boolean(normalizeUrl(entry)));
}

function sanitizeLaneHints(value: unknown) {
  return Array.from(
    new Set(
      asStringArray(value).filter(
        (entry): entry is SignalLane => VALID_LANES.has(entry as SignalLane),
      ),
    ),
  );
}

function sanitizePostType(value: unknown): XaiPostType {
  const normalized = asOptionalString(value);

  if (!normalized || !VALID_POST_TYPES.has(normalized as XaiPostType)) {
    return "original";
  }

  return normalized as XaiPostType;
}

function requireRawUrl(
  value: unknown,
  itemIndex: number,
  field: string,
  issues: IntakeIssueNote[],
) {
  const rawValue = asOptionalString(value);

  if (!rawValue) {
    issues.push(
      buildIssue(
        "missing_required_field",
        `Provider item is missing required field: ${field}`,
        itemIndex,
        field,
      ),
    );
    return null;
  }

  if (!normalizeUrl(rawValue)) {
    issues.push(
      buildIssue(
        "invalid_url",
        `Provider item field ${field} is not a valid absolute URL.`,
        itemIndex,
        field,
      ),
    );
    return null;
  }

  return rawValue;
}

export function validateXSearchProviderResult(
  providerResult: XaiProviderResult<unknown>,
): ValidatedProviderResult<ValidatedXaiXSearchItem> {
  const issues: IntakeIssueNote[] = [];
  const items: ValidatedProviderResult<ValidatedXaiXSearchItem>["items"] = [];

  providerResult.items.forEach((rawItem, itemIndex) => {
    if (!isObject(rawItem)) {
      issues.push(
        buildIssue(
          "invalid_item_shape",
          "Provider returned a non-object X search item.",
          itemIndex,
        ),
      );
      return;
    }

    const permalinkUrl = requireRawUrl(
      rawItem.permalinkUrl,
      itemIndex,
      "permalinkUrl",
      issues,
    );

    if (!permalinkUrl) {
      return;
    }

    items.push({
      itemIndex,
      rawItemJson: rawItem,
      item: {
        externalId: asOptionalString(rawItem.externalId),
        quotedPostId: asOptionalString(rawItem.quotedPostId),
        repliedToPostId: asOptionalString(rawItem.repliedToPostId),
        sharedPostId: asOptionalString(rawItem.sharedPostId),
        parentThreadId: asOptionalString(rawItem.parentThreadId),
        authorHandle: asOptionalString(rawItem.authorHandle),
        authorName: asOptionalString(rawItem.authorName),
        authorProfileUrl: asOptionalValidUrl(rawItem.authorProfileUrl),
        permalinkUrl,
        rawText: asOptionalString(rawItem.rawText),
        publishedAt: asOptionalTimestamp(rawItem.publishedAt),
        postType: sanitizePostType(rawItem.postType),
        linkedUrls: sanitizeLinkedUrls(rawItem.linkedUrls),
        laneHints: sanitizeLaneHints(rawItem.laneHints),
        relevanceNote: asOptionalString(rawItem.relevanceNote),
      },
    });
  });

  return {
    providerRequestId: providerResult.providerRequestId,
    requestPayload: providerResult.requestPayload,
    responseSummary: providerResult.responseSummary,
    rawItemCount: providerResult.items.length,
    items,
    issues,
  };
}

export function validateWebSearchProviderResult(
  providerResult: XaiProviderResult<unknown>,
): ValidatedProviderResult<ValidatedXaiWebSearchItem> {
  const issues: IntakeIssueNote[] = [];
  const items: ValidatedProviderResult<ValidatedXaiWebSearchItem>["items"] = [];

  providerResult.items.forEach((rawItem, itemIndex) => {
    if (!isObject(rawItem)) {
      issues.push(
        buildIssue(
          "invalid_item_shape",
          "Provider returned a non-object web search item.",
          itemIndex,
        ),
      );
      return;
    }

    const url = requireRawUrl(rawItem.url, itemIndex, "url", issues);

    if (!url) {
      return;
    }

    items.push({
      itemIndex,
      rawItemJson: rawItem,
      item: {
        title: asOptionalString(rawItem.title),
        url,
        domain: asOptionalString(rawItem.domain),
        sourceName: asOptionalString(rawItem.sourceName),
        rawText: asOptionalString(rawItem.rawText),
        publishedAt: asOptionalTimestamp(rawItem.publishedAt),
        linkedUrls: sanitizeLinkedUrls(rawItem.linkedUrls),
        laneHints: sanitizeLaneHints(rawItem.laneHints),
        relevanceNote: asOptionalString(rawItem.relevanceNote),
      },
    });
  });

  return {
    providerRequestId: providerResult.providerRequestId,
    requestPayload: providerResult.requestPayload,
    responseSummary: providerResult.responseSummary,
    rawItemCount: providerResult.items.length,
    items,
    issues,
  };
}
