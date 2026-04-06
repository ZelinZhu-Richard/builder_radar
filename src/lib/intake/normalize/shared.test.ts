import test from "node:test";
import assert from "node:assert/strict";
import {
  computeDedupeKey,
  extractUrlsFromText,
  normalizeUrl,
} from "./shared";

test("normalizeUrl strips tracking params and normalizes case", () => {
  assert.equal(
    normalizeUrl("HTTP://Example.com/path/?utm_source=test&b=2&a=1#section"),
    "https://example.com/path?a=1&b=2",
  );
});

test("normalizeUrl rejects malformed absolute urls", () => {
  assert.equal(normalizeUrl("not a url"), null);
  assert.equal(normalizeUrl("x.com/demo/status/1"), null);
});

test("extractUrlsFromText trims trailing punctuation and drops invalid urls", () => {
  assert.deepEqual(extractUrlsFromText("Docs: https://example.com/a?utm_source=test."), [
    "https://example.com/a?utm_source=test",
  ]);
});

test("computeDedupeKey is stable for equivalent normalized input", () => {
  const first = computeDedupeKey({
    sourceType: "x_post",
    normalizedUrl: "https://x.com/demo/status/1",
    normalizedText: "Shipped memory layer v2",
    authorNormalizedHandle: "demo",
    publishedAt: "2026-04-06T12:34:56.000Z",
  });
  const second = computeDedupeKey({
    sourceType: "x_post",
    normalizedUrl: "https://x.com/demo/status/1",
    normalizedText: "shipped memory layer v2",
    authorNormalizedHandle: "demo",
    publishedAt: "2026-04-06T12:34:20.000Z",
  });

  assert.equal(first, second);
});
