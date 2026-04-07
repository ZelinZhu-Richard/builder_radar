import test from "node:test";
import assert from "node:assert/strict";
import {
  validateWebSearchProviderResult,
  validateXSearchProviderResult,
} from "./validate";

test("validateXSearchProviderResult skips malformed items and keeps valid candidates", () => {
  const result = validateXSearchProviderResult({
    providerRequestId: "mock-x",
    requestPayload: { mock: true },
    responseSummary: { mock: true },
    items: [
      "bad-item",
      {
        authorHandle: "demo",
      },
      {
        externalId: "x-1",
        quotedPostId: "x-root",
        repliedToPostId: "x-parent",
        sharedPostId: "x-shared",
        parentThreadId: "thread-1",
        authorHandle: "demo",
        authorName: "Demo",
        authorProfileUrl: "not-a-url",
        permalinkUrl: "https://x.com/demo/status/1",
        rawText: "ship",
        publishedAt: "not-a-date",
        postType: "weird-type",
        linkedUrls: ["https://example.com/doc", "not-a-url"],
        laneHints: ["ai", "noise"],
        relevanceNote: "first-hand",
      },
    ],
  });

  assert.equal(result.rawItemCount, 3);
  assert.equal(result.items.length, 1);
  assert.equal(result.issues.length, 2);
  assert.equal(result.items[0]?.item.authorProfileUrl, null);
  assert.equal(result.items[0]?.item.publishedAt, null);
  assert.equal(result.items[0]?.item.quotedPostId, "x-root");
  assert.equal(result.items[0]?.item.repliedToPostId, "x-parent");
  assert.equal(result.items[0]?.item.sharedPostId, "x-shared");
  assert.equal(result.items[0]?.item.parentThreadId, "thread-1");
  assert.deepEqual(result.items[0]?.item.laneHints, ["ai"]);
  assert.deepEqual(result.items[0]?.item.linkedUrls, ["https://example.com/doc"]);
  assert.equal(result.items[0]?.item.postType, "original");
});

test("validateWebSearchProviderResult rejects items without a valid url", () => {
  const result = validateWebSearchProviderResult({
    providerRequestId: "mock-web",
    requestPayload: { mock: true },
    responseSummary: { mock: true },
    items: [
      {
        title: "Bad item",
        url: "not-a-url",
      },
      {
        title: "Good item",
        url: "https://example.com/page?utm_source=test",
        domain: "example.com",
        sourceName: "Example",
        rawText: "hello",
        publishedAt: "2026-04-06T09:00:00Z",
        linkedUrls: ["https://example.com/child"],
        laneHints: ["builders", "noise"],
        relevanceNote: "useful",
      },
    ],
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.issues.length, 1);
  assert.equal(result.items[0]?.item.url, "https://example.com/page?utm_source=test");
  assert.deepEqual(result.items[0]?.item.laneHints, ["builders"]);
});
