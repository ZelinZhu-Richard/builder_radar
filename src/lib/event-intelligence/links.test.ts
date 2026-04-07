import test from "node:test";
import assert from "node:assert/strict";
import { buildPromotedEventLinks, getHighSignalAnchorLinks } from "./links";
import type { RawItemLinkRow, RawItemRow } from "./types";

function makeRawItem(overrides: Partial<RawItemRow> = {}): RawItemRow {
  return {
    id: "raw-1",
    source_type: "web_result",
    platform: "web",
    external_id: null,
    quoted_external_id: null,
    replied_to_external_id: null,
    shared_external_id: null,
    parent_thread_external_id: null,
    dedupe_key: "web:https://example.com/post",
    matched_trusted_account_id: null,
    author_handle: null,
    author_normalized_handle: null,
    author_name: null,
    author_url: null,
    title: "Builder tooling launch",
    raw_text: "Docs are live and the repo is public.",
    normalized_text: "Docs are live and the repo is public.",
    raw_url: "https://docs.example.com/product?utm_source=x",
    normalized_url: "https://docs.example.com/product",
    published_at: "2026-04-06T10:00:00.000Z",
    collected_at: "2026-04-06T10:05:00.000Z",
    language_code: null,
    lane_hints: ["builders"],
    item_kind_hint: "reference_page",
    is_from_trusted_account: false,
    is_repost: false,
    is_quote: false,
    is_reply: false,
    raw_payload_json: {},
    metadata_json: {},
    first_seen_run_id: null,
    created_at: "2026-04-06T10:05:00.000Z",
    updated_at: "2026-04-06T10:05:00.000Z",
    ...overrides,
  };
}

function makeRawLink(overrides: Partial<RawItemLinkRow> = {}): RawItemLinkRow {
  return {
    id: "link-1",
    raw_item_id: "raw-1",
    discovered_via: "body",
    link_role: "evidence",
    raw_url: "https://github.com/acme/product",
    normalized_url: "https://github.com/acme/product",
    domain: "github.com",
    title: "Repo",
    position: 0,
    created_at: "2026-04-06T10:05:00.000Z",
    ...overrides,
  };
}

test("buildPromotedEventLinks classifies canonical docs and repos", () => {
  const rawItem = makeRawItem();
  const links = [
    makeRawLink(),
    makeRawLink({
      id: "link-2",
      raw_url: "https://x.com/acme/status/123",
      normalized_url: "https://x.com/acme/status/123",
      domain: "x.com",
    }),
  ];

  const promoted = buildPromotedEventLinks(rawItem, links);

  assert.equal(promoted[0]?.linkRole, "official_doc");
  assert.ok(promoted.some((link) => link.linkRole === "repo"));
  assert.equal(getHighSignalAnchorLinks(promoted).some((link) => link.domain === "x.com"), false);
});
