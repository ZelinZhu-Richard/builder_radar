import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWebResult } from "./web-result";
import { normalizeXPostResult } from "./x-post";

test("normalizeXPostResult handles missing optional fields consistently", () => {
  const result = normalizeXPostResult({
    validatedItem: {
      itemIndex: 0,
      rawItemJson: {
        permalinkUrl: "https://x.com/demo/status/1?utm_source=test",
      },
      item: {
        externalId: null,
        authorHandle: null,
        authorName: null,
        authorProfileUrl: null,
        permalinkUrl: "https://x.com/demo/status/1?utm_source=test",
        rawText: null,
        publishedAt: null,
        postType: "original",
        linkedUrls: ["https://example.com/doc?utm_source=test"],
        laneHints: ["ai"],
        relevanceNote: null,
      },
    },
    query: {
      id: "x-demo",
      querySource: "x_search",
      queryText: "demo",
      tool: "x_search",
      maxItems: 5,
      laneHint: "ai",
    },
    trustedAccountsByHandle: new Map(),
    collectedAt: new Date("2026-04-06T12:00:00.000Z"),
  });

  assert.equal(result.externalId, null);
  assert.equal(result.authorHandle, null);
  assert.equal(result.authorName, null);
  assert.equal(result.title, null);
  assert.equal(result.normalizedUrl, "https://x.com/demo/status/1");
  assert.equal(result.extractedLinks.length, 2);
});

test("normalizeWebResult infers opportunity pages and strips url tracking", () => {
  const result = normalizeWebResult({
    validatedItem: {
      itemIndex: 1,
      rawItemJson: {
        url: "https://example.com/programs/apply?utm_source=test",
      },
      item: {
        title: "AI Builder Fellowship Program",
        url: "https://example.com/programs/apply?utm_source=test",
        domain: "example.com",
        sourceName: "Example Programs",
        rawText: "Apply here https://example.com/programs/apply/step-2.",
        publishedAt: "2026-04-06T10:00:00.000Z",
        linkedUrls: [],
        laneHints: ["builders"],
        relevanceNote: "Opportunity page",
      },
    },
    query: {
      id: "web-demo",
      querySource: "web_search",
      queryText: "demo",
      tool: "web_search",
      maxItems: 5,
      laneHint: "builders",
    },
    collectedAt: new Date("2026-04-06T12:00:00.000Z"),
  });

  assert.equal(result.itemKindHint, "opportunity_page");
  assert.equal(result.normalizedUrl, "https://example.com/programs/apply");
  assert.equal(result.extractedLinks.length, 2);
});
