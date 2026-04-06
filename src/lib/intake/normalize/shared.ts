import { createHash } from "node:crypto";
import type { SignalLane } from "@/types";
import type { IntakeSourceType, RawItemLinkRole } from "@/types";
import type { NormalizedRawItemLink } from "../types";

const TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "si",
  "source",
  "s",
  "t",
  "utm_campaign",
  "utm_content",
  "utm_id",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

export function normalizeHandle(handle?: string | null) {
  if (!handle) {
    return null;
  }

  return handle.replace(/^@+/, "").trim().toLowerCase() || null;
}

export function cleanText(input?: string | null) {
  if (!input) {
    return null;
  }

  const value = input.replace(/\s+/g, " ").trim();
  return value.length > 0 ? value : null;
}

export function truncateText(input?: string | null, max = 140) {
  const cleaned = cleanText(input);
  if (!cleaned) {
    return null;
  }

  if (cleaned.length <= max) {
    return cleaned;
  }

  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

export function normalizeTimestamp(input?: string | null) {
  if (!input) {
    return null;
  }

  const value = new Date(input);
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString();
}

export function normalizeUrl(rawUrl?: string | null) {
  const candidate = rawUrl?.trim();
  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    url.protocol = "https:";
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();

    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    url.searchParams.sort();

    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function extractDomain(url?: string | null) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function extractUrlsFromText(input?: string | null) {
  const cleaned = cleanText(input);
  if (!cleaned) {
    return [];
  }

  return Array.from(cleaned.matchAll(/https?:\/\/[^\s)]+/g))
    .map((match) => match[0].replace(/[.,!?;:]+$/g, ""))
    .filter((url) => Boolean(normalizeUrl(url)));
}

export function uniqueLaneHints(values: Array<SignalLane | undefined | null>) {
  return Array.from(
    new Set(values.filter((lane): lane is SignalLane => Boolean(lane))),
  );
}

export function uniqueLinks(links: NormalizedRawItemLink[]) {
  const seen = new Set<string>();
  const result: NormalizedRawItemLink[] = [];

  for (const link of links) {
    const key = `${link.normalizedUrl}|${link.linkRole}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(link);
  }

  return result;
}

export function buildLink(
  rawUrl: string | null | undefined,
  {
    discoveredVia,
    linkRole,
    title,
    position,
  }: {
    discoveredVia: NormalizedRawItemLink["discoveredVia"];
    linkRole: RawItemLinkRole;
    title?: string | null;
    position?: number | null;
  },
) {
  const normalizedUrl = normalizeUrl(rawUrl);
  if (!rawUrl || !normalizedUrl) {
    return null;
  }

  return {
    discoveredVia,
    linkRole,
    rawUrl,
    normalizedUrl,
    domain: extractDomain(normalizedUrl),
    title: title ?? null,
    position: position ?? null,
  } satisfies NormalizedRawItemLink;
}

export function computeDedupeKey({
  sourceType,
  externalId,
  normalizedUrl,
  normalizedText,
  authorNormalizedHandle,
  publishedAt,
}: {
  sourceType: IntakeSourceType;
  externalId?: string | null;
  normalizedUrl: string;
  normalizedText?: string | null;
  authorNormalizedHandle?: string | null;
  publishedAt?: string | null;
}) {
  if (externalId) {
    return `${sourceType}:${externalId}`;
  }

  if (sourceType === "web_result" && normalizedUrl) {
    return `${sourceType}:${normalizedUrl}`;
  }

  const publishedBucket = publishedAt ? publishedAt.slice(0, 16) : "unknown-time";
  const canonicalText =
    normalizedText?.toLowerCase().slice(0, 512) ?? "no-normalized-text";
  const canonicalUrl = normalizedUrl || "no-normalized-url";
  const payload = [
    sourceType,
    canonicalUrl,
    authorNormalizedHandle ?? "unknown-author",
    canonicalText,
    publishedBucket,
  ].join("|");

  return `${sourceType}:hash:${createHash("sha256").update(payload).digest("hex")}`;
}
