import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEventRefreshResult,
  buildPromotedEventLinks,
  chooseEventMatch,
  choosePrimaryMembership,
  scoreEventMatch,
} from "./heuristics";
import type {
  CandidateEventContext,
  EventRoleDecision,
  EventRawItemRow,
  EventLinkRow,
  RawItemRow,
} from "./types";

function makeRawItem(id: string, overrides: Partial<RawItemRow> = {}): RawItemRow {
  return {
    id,
    source_type: "x_post",
    platform: "x",
    external_id: id,
    quoted_external_id: null,
    replied_to_external_id: null,
    shared_external_id: null,
    parent_thread_external_id: null,
    dedupe_key: `x_post:${id}`,
    matched_trusted_account_id: "trusted-1",
    author_handle: "@builder",
    author_normalized_handle: "builder",
    author_name: "Builder",
    author_url: "https://x.com/builder",
    title: "Memory layer v2 ships tighter replay controls",
    raw_text: "Memory layer v2 ships tighter replay controls and docs https://docs.example.com/memory",
    normalized_text: "Memory layer v2 ships tighter replay controls and docs https://docs.example.com/memory",
    raw_url: `https://x.com/builder/status/${id}`,
    normalized_url: `https://x.com/builder/status/${id}`,
    published_at: "2026-04-06T10:00:00.000Z",
    collected_at: "2026-04-06T10:05:00.000Z",
    language_code: null,
    lane_hints: ["builders"],
    item_kind_hint: "post",
    is_from_trusted_account: true,
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

function makeMembership(rawItemId: string, overrides: Partial<EventRawItemRow> = {}): EventRawItemRow {
  return {
    id: `membership-${rawItemId}`,
    event_id: "event-1",
    raw_item_id: rawItemId,
    source_role: "trusted_amplification",
    is_primary: false,
    is_material_update: false,
    assignment_method: "soft_match",
    assignment_score: 90,
    reason_summary: null,
    metadata_json: {},
    first_attached_at: "2026-04-06T10:05:00.000Z",
    updated_at: "2026-04-06T10:05:00.000Z",
    ...overrides,
  };
}

function makeEventLink(overrides: Partial<EventLinkRow> = {}): EventLinkRow {
  return {
    id: "event-link-1",
    event_id: "event-1",
    raw_item_link_id: "raw-link-1",
    source_raw_item_id: "raw-1",
    raw_url: "https://docs.example.com/memory",
    normalized_url: "https://docs.example.com/memory",
    domain: "docs.example.com",
    title: "Docs",
    link_role: "official_doc",
    provenance_count: 1,
    is_canonical: true,
    first_seen_at: "2026-04-06T10:05:00.000Z",
    last_seen_at: "2026-04-06T10:05:00.000Z",
    metadata_json: {},
    ...overrides,
  };
}

test("choosePrimaryMembership corrects primary source when original arrives after amplification", () => {
  const repost = makeRawItem("raw-repost", {
    title: "Trusted repost of memory layer release",
    is_repost: true,
    is_from_trusted_account: true,
  });
  const original = makeRawItem("raw-original");
  const roleByRawItemId = new Map<string, EventRoleDecision>([
    [
      repost.id,
      {
        sourceRole: "trusted_amplification",
        isMaterialUpdate: false,
        isLowValue: false,
        reasonSummary: "",
      },
    ],
    [
      original.id,
      {
        sourceRole: "primary_source",
        isMaterialUpdate: true,
        isLowValue: false,
        reasonSummary: "",
      },
    ],
  ]);

  const primary = choosePrimaryMembership({
    rawItems: [repost, original],
    roleByRawItemId,
  });

  assert.equal(primary?.id, "raw-original");
});

test("scoreEventMatch keeps different canonical docs split even with same author", () => {
  const rawItem = makeRawItem("raw-2", {
    raw_text: "Memory layer v3 docs https://docs.example.com/memory-v3",
    normalized_text: "Memory layer v3 docs https://docs.example.com/memory-v3",
  });
  const eventContext: CandidateEventContext = {
    event: {
      id: "event-1",
      stable_key: "link:official_doc:https://docs.example.com/memory",
      title: "Memory layer v2 ships tighter replay controls",
      summary: null,
      primary_lane: "builders",
      lane_hints: ["builders"],
      event_traits: ["first_hand"],
      event_kind_hint: "post",
      status: "new",
      primary_raw_item_id: "raw-1",
      primary_source_role: "primary_source",
      first_seen_at: "2026-04-06T10:05:00.000Z",
      latest_seen_at: "2026-04-06T10:05:00.000Z",
      last_material_update_at: "2026-04-06T10:05:00.000Z",
      member_count: 1,
      material_update_count: 1,
      merged_into_event_id: null,
      primary_raw_item_override_id: null,
      cluster_explanation_json: {},
      metadata_json: {},
      created_at: "2026-04-06T10:05:00.000Z",
      updated_at: "2026-04-06T10:05:00.000Z",
    },
    primaryRawItem: makeRawItem("raw-1"),
    memberships: [makeMembership("raw-1", { source_role: "primary_source", is_primary: true })],
    rawItems: [makeRawItem("raw-1")],
    eventLinks: [makeEventLink()],
  };

  const promotedLinks = buildPromotedEventLinks(rawItem, [
    {
      id: "raw-link-2",
      raw_item_id: rawItem.id,
      discovered_via: "body",
      link_role: "evidence",
      raw_url: "https://docs.example.com/memory-v3",
      normalized_url: "https://docs.example.com/memory-v3",
      domain: "docs.example.com",
      title: "Docs v3",
      position: 0,
      created_at: "2026-04-06T10:05:00.000Z",
    },
  ]);
  const decision = chooseEventMatch([
    scoreEventMatch({
      rawItem,
      promotedLinks,
      event: eventContext,
    }),
  ]);

  assert.equal(decision.matchedEventId, null);
});

test("buildEventRefreshResult does not advance material freshness for commentary-only repetition", () => {
  const primary = makeRawItem("raw-primary");
  const commentary = makeRawItem("raw-commentary", {
    matched_trusted_account_id: null,
    author_handle: "@observer",
    author_normalized_handle: "observer",
    is_from_trusted_account: false,
    title: "Commentary on memory layer release",
    raw_text: "Interesting release but no new docs.",
    normalized_text: "Interesting release but no new docs.",
    published_at: "2026-04-07T10:00:00.000Z",
    collected_at: "2026-04-07T10:05:00.000Z",
  });
  const roleByRawItemId = new Map<string, EventRoleDecision>([
    [
      primary.id,
      {
        sourceRole: "primary_source",
        isMaterialUpdate: true,
        isLowValue: false,
        reasonSummary: "",
      },
    ],
    [
      commentary.id,
      {
        sourceRole: "low_value_repetition",
        isMaterialUpdate: false,
        isLowValue: true,
        reasonSummary: "",
      },
    ],
  ]);

  const refresh = buildEventRefreshResult({
    existingEvent: null,
    rawItems: [primary, commentary],
    roleByRawItemId,
    promotedLinks: [],
    now: new Date("2026-04-07T12:00:00.000Z"),
    breakingWindowHours: 24,
    latestAssignmentMethod: "soft_match",
  });

  assert.equal(refresh.primaryRawItemId, primary.id);
  assert.equal(refresh.lastMaterialUpdateAt, primary.published_at);
  assert.equal(refresh.memberCount, 2);
});

test("chooseEventMatch keeps relation-linked replies in the same event", () => {
  const original = makeRawItem("raw-1");
  const reply = makeRawItem("raw-2", {
    external_id: "raw-2",
    replied_to_external_id: original.external_id,
    is_reply: true,
    raw_text: "Follow-up implementation detail in thread.",
    normalized_text: "Follow-up implementation detail in thread.",
  });
  const eventContext: CandidateEventContext = {
    event: {
      id: "event-1",
      stable_key: null,
      title: original.title ?? "memory layer",
      summary: null,
      primary_lane: "builders",
      lane_hints: ["builders"],
      event_traits: ["first_hand"],
      event_kind_hint: "post",
      status: "new",
      primary_raw_item_id: original.id,
      primary_source_role: "primary_source",
      first_seen_at: "2026-04-06T10:05:00.000Z",
      latest_seen_at: "2026-04-06T10:05:00.000Z",
      last_material_update_at: "2026-04-06T10:05:00.000Z",
      member_count: 1,
      material_update_count: 1,
      merged_into_event_id: null,
      primary_raw_item_override_id: null,
      cluster_explanation_json: {},
      metadata_json: {},
      created_at: "2026-04-06T10:05:00.000Z",
      updated_at: "2026-04-06T10:05:00.000Z",
    },
    primaryRawItem: original,
    memberships: [makeMembership("raw-1", { source_role: "primary_source", is_primary: true })],
    rawItems: [original],
    eventLinks: [],
  };

  const decision = chooseEventMatch([
    scoreEventMatch({
      rawItem: reply,
      promotedLinks: [],
      event: eventContext,
    }),
  ]);

  assert.equal(decision.matchedEventId, "event-1");
  assert.equal(decision.reasons.includes("relation_id_match"), true);
});

test("buildEventRefreshResult leaves stableKey null without a strong anchor", () => {
  const refresh = buildEventRefreshResult({
    existingEvent: {
      id: "event-1",
      stable_key: null,
      title: "Memory layer v2 ships tighter replay controls",
      summary: null,
      primary_lane: "builders",
      lane_hints: ["builders"],
      event_traits: ["first_hand"],
      event_kind_hint: "post",
      status: "new",
      primary_raw_item_id: "raw-1",
      primary_source_role: "commentary",
      first_seen_at: "2026-04-06T10:05:00.000Z",
      latest_seen_at: "2026-04-06T10:05:00.000Z",
      last_material_update_at: "2026-04-06T10:05:00.000Z",
      member_count: 1,
      material_update_count: 1,
      merged_into_event_id: null,
      primary_raw_item_override_id: null,
      cluster_explanation_json: {},
      metadata_json: {},
      created_at: "2026-04-06T10:05:00.000Z",
      updated_at: "2026-04-06T10:05:00.000Z",
    },
    rawItems: [
      makeRawItem("raw-commentary", {
        matched_trusted_account_id: null,
        author_handle: "@observer",
        author_normalized_handle: "observer",
        is_from_trusted_account: false,
        title: "Commentary on memory layer release",
        raw_text: "Interesting release but no new docs.",
        normalized_text: "Interesting release but no new docs.",
      }),
    ],
    roleByRawItemId: new Map([
      [
        "raw-commentary",
        {
          sourceRole: "commentary",
          isMaterialUpdate: false,
          isLowValue: false,
          reasonSummary: "",
        },
      ],
    ]),
    promotedLinks: [],
    now: new Date("2026-04-07T12:00:00.000Z"),
    breakingWindowHours: 24,
    latestAssignmentMethod: "soft_match",
  });

  assert.equal(refresh.stableKey, null);
});
