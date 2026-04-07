import { normalizeUrl } from "@/lib/intake/normalize/shared";
import type {
  EventSourceRole,
  RawItemLinkDiscoverySource,
  RawItemLinkRole,
  SignalLane,
} from "@/types";
import type { RawItemLinkRow, RawItemRow } from "../types";

export interface EventIntelligenceEvalItem {
  rawItem: RawItemRow;
  rawItemLinks: RawItemLinkRow[];
}

export interface EventIntelligenceEvalExpectedGroup {
  rawItemIds: string[];
  primaryRawItemId: string;
  primarySourceRole: EventSourceRole;
  materialUpdateRawItemIds: string[];
  stableKey?: string | null | "present";
}

export interface EventIntelligenceEvalScenario {
  id: string;
  description: string;
  items: EventIntelligenceEvalItem[];
  expectedGroups: EventIntelligenceEvalExpectedGroup[];
}

function at(hour: number, minute = 0) {
  return `2026-04-06T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

function makeRawItemLinks(
  rawItemId: string,
  urls: Array<{
    url: string;
    title?: string | null;
    linkRole?: RawItemLinkRole;
    discoveredVia?: RawItemLinkDiscoverySource;
  }>,
) {
  return urls.map((link, index) => ({
    id: `${rawItemId}-link-${index + 1}`,
    raw_item_id: rawItemId,
    discovered_via: link.discoveredVia ?? "provider_field",
    link_role: link.linkRole ?? "evidence",
    raw_url: link.url,
    normalized_url: normalizeUrl(link.url) ?? link.url,
    domain: (() => {
      try {
        return new URL(normalizeUrl(link.url) ?? link.url).hostname.toLowerCase();
      } catch {
        return null;
      }
    })(),
    title: link.title ?? null,
    position: index,
    created_at: at(12, index),
  })) satisfies RawItemLinkRow[];
}

function makeXItem({
  id,
  handle = "builder",
  title,
  rawText,
  lane = "builders",
  trusted = true,
  postType = "original",
  publishedAt = at(10),
  links = [],
  quotedPostId = null,
  repliedToPostId = null,
  sharedPostId = null,
  parentThreadId = null,
}: {
  id: string;
  handle?: string;
  title: string;
  rawText: string;
  lane?: SignalLane;
  trusted?: boolean;
  postType?: "original" | "repost" | "quote" | "reply";
  publishedAt?: string;
  links?: Array<{ url: string; title?: string | null }>;
  quotedPostId?: string | null;
  repliedToPostId?: string | null;
  sharedPostId?: string | null;
  parentThreadId?: string | null;
}): EventIntelligenceEvalItem {
  const rawUrl = `https://x.com/${handle}/status/${id}`;

  return {
    rawItem: {
      id,
      source_type: "x_post",
      platform: "x",
      external_id: id,
      quoted_external_id: quotedPostId,
      replied_to_external_id: repliedToPostId,
      shared_external_id: sharedPostId,
      parent_thread_external_id: parentThreadId,
      dedupe_key: `x_post:${id}`,
      matched_trusted_account_id: trusted ? `trusted-${handle}` : null,
      author_handle: handle,
      author_normalized_handle: handle.toLowerCase(),
      author_name: handle,
      author_url: `https://x.com/${handle}`,
      title,
      raw_text: rawText,
      normalized_text: rawText.toLowerCase(),
      raw_url: rawUrl,
      normalized_url: rawUrl,
      published_at: publishedAt,
      collected_at: publishedAt,
      language_code: null,
      lane_hints: [lane],
      item_kind_hint: "post",
      is_from_trusted_account: trusted,
      is_repost: postType === "repost",
      is_quote: postType === "quote",
      is_reply: postType === "reply",
      raw_payload_json: {},
      metadata_json: {},
      first_seen_run_id: null,
      created_at: publishedAt,
      updated_at: publishedAt,
    },
    rawItemLinks: makeRawItemLinks(id, links),
  };
}

function makeWebItem({
  id,
  url,
  title,
  rawText,
  lane = "builders",
  itemKindHint = "reference_page",
  publishedAt = at(10),
  links = [],
}: {
  id: string;
  url: string;
  title: string;
  rawText: string;
  lane?: SignalLane;
  itemKindHint?: string;
  publishedAt?: string;
  links?: Array<{ url: string; title?: string | null }>;
}): EventIntelligenceEvalItem {
  const normalizedUrl = normalizeUrl(url) ?? url;

  return {
    rawItem: {
      id,
      source_type: "web_result",
      platform: "web",
      external_id: null,
      quoted_external_id: null,
      replied_to_external_id: null,
      shared_external_id: null,
      parent_thread_external_id: null,
      dedupe_key: `web_result:${normalizedUrl}`,
      matched_trusted_account_id: null,
      author_handle: null,
      author_normalized_handle: null,
      author_name: null,
      author_url: null,
      title,
      raw_text: rawText,
      normalized_text: rawText.toLowerCase(),
      raw_url: url,
      normalized_url: normalizedUrl,
      published_at: publishedAt,
      collected_at: publishedAt,
      language_code: null,
      lane_hints: [lane],
      item_kind_hint: itemKindHint,
      is_from_trusted_account: false,
      is_repost: false,
      is_quote: false,
      is_reply: false,
      raw_payload_json: {},
      metadata_json: {},
      first_seen_run_id: null,
      created_at: publishedAt,
      updated_at: publishedAt,
    },
    rawItemLinks: makeRawItemLinks(id, links),
  };
}

const repoA = "https://github.com/acme/memory-layer";
const repoB = "https://github.com/acme/memory-layer-v3";
const repoC = "https://github.com/acme/agent-evals";
const docA = "https://docs.acme.dev/memory-layer";
const docB = "https://docs.acme.dev/memory-layer-v3";
const docC = "https://docs.acme.dev/agent-evals";
const paperA = "https://arxiv.org/abs/2604.12345";
const opportunityA = "https://acme.dev/programs/design-partner/apply";
const opportunityB = "https://acme.dev/programs/hackathon/apply";
const evidenceA = "https://research.acme.dev/memory-benchmark";

export const EVENT_INTELLIGENCE_EVAL_SCENARIOS: EventIntelligenceEvalScenario[] = [
  {
    id: "01-original-only",
    description: "single trusted original post becomes one event",
    items: [
      makeXItem({
        id: "x01",
        title: "Memory layer ships",
        rawText: "Memory layer ships with tighter replay controls.",
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x01"],
        primaryRawItemId: "x01",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x01"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "02-doc-only",
    description: "single official doc becomes one event",
    items: [
      makeWebItem({
        id: "w02",
        url: docA,
        title: "Memory Layer Documentation",
        rawText: "Official docs for the memory layer release.",
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["w02"],
        primaryRawItemId: "w02",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["w02"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "03-original-plus-repost",
    description: "trusted repost stays amplification under original",
    items: [
      makeXItem({
        id: "x03-original",
        title: "Trace benchmark ships",
        rawText: "Trace benchmark ships with linked assets.",
        lane: "ai",
        links: [{ url: docC }],
      }),
      makeXItem({
        id: "x03-repost",
        title: "Sharing the trace benchmark release",
        rawText: "Worth reading.",
        lane: "ai",
        postType: "repost",
        sharedPostId: "x03-original",
        links: [{ url: docC }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x03-original", "x03-repost"],
        primaryRawItemId: "x03-original",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x03-original"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "04-repost-first-original-later",
    description: "late original corrects primary source after trusted amplification",
    items: [
      makeXItem({
        id: "x04-repost",
        title: "Sharing memory layer v2",
        rawText: "Worth reading if you build browser agents.",
        postType: "repost",
        sharedPostId: "x04-original",
        publishedAt: at(9),
      }),
      makeXItem({
        id: "x04-original",
        title: "Memory layer v2 ships",
        rawText: "Memory layer v2 ships today.",
        publishedAt: at(10),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x04-repost", "x04-original"],
        primaryRawItemId: "x04-original",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x04-original"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "05-reply-thread",
    description: "same thread reply becomes direct participant update",
    items: [
      makeXItem({
        id: "x05-original",
        title: "Agent runtime ships",
        rawText: "Agent runtime ships with memory hooks.",
      }),
      makeXItem({
        id: "x05-reply",
        title: "Thread follow-up",
        rawText: "Follow-up with implementation notes.",
        postType: "reply",
        repliedToPostId: "x05-original",
        parentThreadId: "thread-05",
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x05-original", "x05-reply"],
        primaryRawItemId: "x05-original",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x05-original", "x05-reply"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "06-trusted-quote-same-repo",
    description: "trusted quote with same repo link stays amplification",
    items: [
      makeXItem({
        id: "x06-original",
        title: "Memory repo release",
        rawText: "Repo is public now.",
        links: [{ url: repoA }],
      }),
      makeXItem({
        id: "x06-quote",
        title: "Quoting the release",
        rawText: "This repo is worth cloning.",
        postType: "quote",
        quotedPostId: "x06-original",
        links: [{ url: repoA }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x06-original", "x06-quote"],
        primaryRawItemId: "x06-original",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x06-original"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "07-same-handle-different-repos-split",
    description: "same handle with different repo anchors should split",
    items: [
      makeXItem({
        id: "x07-a",
        title: "Memory repo release",
        rawText: "Repo A is public.",
        links: [{ url: repoA }],
      }),
      makeXItem({
        id: "x07-b",
        title: "Agent evals repo release",
        rawText: "Repo C is public.",
        links: [{ url: repoC }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x07-a"],
        primaryRawItemId: "x07-a",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x07-a"],
        stableKey: "present",
      },
      {
        rawItemIds: ["x07-b"],
        primaryRawItemId: "x07-b",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x07-b"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "08-same-handle-same-repo-merge",
    description: "same repo anchor should merge even when second post is a quote",
    items: [
      makeXItem({
        id: "x08-a",
        title: "Memory repo release",
        rawText: "Repo A is public.",
        links: [{ url: repoA }],
      }),
      makeXItem({
        id: "x08-b",
        title: "Quoting repo A",
        rawText: "Worth trying.",
        postType: "quote",
        quotedPostId: "x08-a",
        links: [{ url: repoA }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x08-a", "x08-b"],
        primaryRawItemId: "x08-a",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x08-a"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "09-commentary-adds-new-doc",
    description: "commentary with a new doc link is a material update",
    items: [
      makeXItem({
        id: "x09-original",
        title: "Memory repo release",
        rawText: "Repo A is public.",
        links: [{ url: repoA }],
      }),
      makeXItem({
        id: "x09-commentary",
        handle: "observer",
        trusted: false,
        title: "Commentary on memory repo release",
        rawText: "The docs link makes this more useful.",
        links: [{ url: repoA }, { url: docA }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x09-original", "x09-commentary"],
        primaryRawItemId: "x09-original",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x09-original", "x09-commentary"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "10-similar-text-different-link-split",
    description: "similar text without shared anchors should split",
    items: [
      makeXItem({
        id: "x10-a",
        title: "Memory layer notes",
        rawText: "Memory layer notes with repo A.",
        links: [{ url: repoA }],
      }),
      makeXItem({
        id: "x10-b",
        handle: "observer",
        trusted: false,
        title: "Memory layer notes",
        rawText: "Memory layer notes with repo B.",
        links: [{ url: repoB }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x10-a"],
        primaryRawItemId: "x10-a",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x10-a"],
        stableKey: "present",
      },
      {
        rawItemIds: ["x10-b"],
        primaryRawItemId: "x10-b",
        primarySourceRole: "commentary",
        materialUpdateRawItemIds: ["x10-b"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "11-opportunity-page-plus-commentary",
    description: "opportunity page and matching commentary should merge",
    items: [
      makeWebItem({
        id: "w11-opportunity",
        url: opportunityA,
        title: "Design Partner Program",
        rawText: "Apply to the design partner program.",
        itemKindHint: "opportunity_page",
      }),
      makeXItem({
        id: "x11-commentary",
        title: "Design partner program is live",
        rawText: "Apply if you run real workflow volume.",
        links: [{ url: opportunityA }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["w11-opportunity", "x11-commentary"],
        primaryRawItemId: "w11-opportunity",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["w11-opportunity", "x11-commentary"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "12-paper-plus-follow-up",
    description: "paper anchor merges author follow-up",
    items: [
      makeWebItem({
        id: "w12-paper",
        url: paperA,
        title: "Agent Trace Benchmark",
        rawText: "Paper describing trace-level failure categories.",
        lane: "ai",
        itemKindHint: "reference_page",
      }),
      makeXItem({
        id: "x12-followup",
        title: "Trace benchmark notes",
        rawText: "Extra notes from the benchmark release.",
        lane: "ai",
        links: [{ url: paperA }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["w12-paper", "x12-followup"],
        primaryRawItemId: "w12-paper",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["w12-paper", "x12-followup"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "13-two-opportunities-split",
    description: "distinct opportunity anchors should stay separate",
    items: [
      makeWebItem({
        id: "w13-a",
        url: opportunityA,
        title: "Design Partner Program",
        rawText: "Apply to the design partner program.",
        itemKindHint: "opportunity_page",
      }),
      makeWebItem({
        id: "w13-b",
        url: opportunityB,
        title: "Hackathon Program",
        rawText: "Apply to the hackathon program.",
        itemKindHint: "opportunity_page",
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["w13-a"],
        primaryRawItemId: "w13-a",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["w13-a"],
        stableKey: "present",
      },
      {
        rawItemIds: ["w13-b"],
        primaryRawItemId: "w13-b",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["w13-b"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "14-tracked-doc-url-merge",
    description: "tracked and canonical doc URLs should normalize into one event",
    items: [
      makeWebItem({
        id: "w14-a",
        url: `${docA}?utm_source=x`,
        title: "Memory Layer Docs",
        rawText: "Docs with tracking params.",
      }),
      makeWebItem({
        id: "w14-b",
        url: docA,
        title: "Memory Layer Docs",
        rawText: "Canonical docs.",
        publishedAt: at(9),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["w14-a", "w14-b"],
        primaryRawItemId: "w14-a",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["w14-a", "w14-b"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "15-same-handle-follow-up-no-thread-id",
    description: "same handle and same anchor can still merge without explicit relation ids",
    items: [
      makeXItem({
        id: "x15-a",
        title: "Memory layer ships",
        rawText: "Repo A ships now.",
        links: [{ url: repoA }],
      }),
      makeXItem({
        id: "x15-b",
        title: "More notes on memory layer",
        rawText: "More notes on repo A.",
        links: [{ url: repoA }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x15-a", "x15-b"],
        primaryRawItemId: "x15-b",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x15-a", "x15-b"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "16-original-plus-doc-primary-switch",
    description: "later official docs can become the canonical primary item",
    items: [
      makeXItem({
        id: "x16-original",
        title: "Memory layer ships",
        rawText: "Docs are live.",
        links: [{ url: docA }],
      }),
      makeWebItem({
        id: "w16-doc",
        url: docA,
        title: "Memory Layer Documentation",
        rawText: "Official docs for the memory layer release.",
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x16-original", "w16-doc"],
        primaryRawItemId: "w16-doc",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x16-original", "w16-doc"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "17-quote-first-original-doc",
    description: "quote first then original and docs should converge to one event",
    items: [
      makeXItem({
        id: "x17-quote",
        title: "Sharing the release",
        rawText: "Worth reading.",
        postType: "quote",
        quotedPostId: "x17-original",
        links: [{ url: docA }],
        publishedAt: at(9),
      }),
      makeXItem({
        id: "x17-original",
        title: "Memory layer ships",
        rawText: "Memory layer ships now.",
        links: [{ url: docA }],
        publishedAt: at(10),
      }),
      makeWebItem({
        id: "w17-doc",
        url: docA,
        title: "Memory Layer Documentation",
        rawText: "Official docs for the memory layer release.",
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x17-quote", "x17-original", "w17-doc"],
        primaryRawItemId: "w17-doc",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x17-quote", "x17-original", "w17-doc"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "18-different-trusted-amplifier",
    description: "trusted amplification from another handle still belongs under original",
    items: [
      makeXItem({
        id: "x18-repost",
        handle: "amplifier",
        title: "Sharing memory layer",
        rawText: "This looks useful.",
        postType: "repost",
        sharedPostId: "x18-original",
        publishedAt: at(9),
      }),
      makeXItem({
        id: "x18-original",
        title: "Memory layer ships",
        rawText: "Memory layer ships now.",
        publishedAt: at(10),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x18-repost", "x18-original"],
        primaryRawItemId: "x18-original",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x18-original"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "19-x-post-plus-repo-page",
    description: "x release post and repo page should merge on repo anchor",
    items: [
      makeXItem({
        id: "x19-post",
        title: "Memory repo release",
        rawText: "Repo A is public.",
        links: [{ url: repoA }],
      }),
      makeWebItem({
        id: "w19-repo",
        url: repoA,
        title: "acme/memory-layer",
        rawText: "Repository for memory-layer.",
        itemKindHint: "repo",
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x19-post", "w19-repo"],
        primaryRawItemId: "w19-repo",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x19-post", "w19-repo"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "20-reply-plus-doc",
    description: "direct participant reply and later docs remain one event",
    items: [
      makeXItem({
        id: "x20-original",
        title: "Agent evals ship",
        rawText: "Agent evals ship now.",
        lane: "ai",
        links: [{ url: docC }],
      }),
      makeXItem({
        id: "x20-reply",
        title: "Extra eval notes",
        rawText: "Extra eval notes in thread.",
        lane: "ai",
        postType: "reply",
        repliedToPostId: "x20-original",
        parentThreadId: "thread-20",
        publishedAt: at(11),
      }),
      makeWebItem({
        id: "w20-doc",
        url: docC,
        title: "Agent Evals Documentation",
        rawText: "Official docs for agent evals.",
        lane: "ai",
        publishedAt: at(12),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x20-original", "x20-reply", "w20-doc"],
        primaryRawItemId: "w20-doc",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x20-original", "x20-reply", "w20-doc"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "21-same-handle-different-docs-split",
    description: "same handle but different docs should stay separate",
    items: [
      makeXItem({
        id: "x21-a",
        title: "Memory docs ship",
        rawText: "Docs A are live.",
        links: [{ url: docA }],
      }),
      makeXItem({
        id: "x21-b",
        title: "Memory v3 docs ship",
        rawText: "Docs B are live.",
        links: [{ url: docB }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x21-a"],
        primaryRawItemId: "x21-a",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x21-a"],
        stableKey: "present",
      },
      {
        rawItemIds: ["x21-b"],
        primaryRawItemId: "x21-b",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x21-b"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "22-parent-thread-merge",
    description: "same parent thread should merge even with weak text overlap",
    items: [
      makeXItem({
        id: "x22-a",
        title: "Runtime release",
        rawText: "Runtime release.",
        parentThreadId: "thread-22",
      }),
      makeXItem({
        id: "x22-b",
        handle: "guest",
        trusted: false,
        title: "Different wording",
        rawText: "A very different follow-up note.",
        parentThreadId: "thread-22",
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x22-a", "x22-b"],
        primaryRawItemId: "x22-a",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x22-a", "x22-b"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "23-conflicting-docs-split",
    description: "conflicting canonical docs should force a split",
    items: [
      makeXItem({
        id: "x23-a",
        title: "Memory layer docs A",
        rawText: "Docs A are live.",
        links: [{ url: docA }],
      }),
      makeXItem({
        id: "x23-b",
        title: "Memory layer docs B",
        rawText: "Docs B are live.",
        links: [{ url: docB }],
        publishedAt: at(11),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x23-a"],
        primaryRawItemId: "x23-a",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x23-a"],
        stableKey: "present",
      },
      {
        rawItemIds: ["x23-b"],
        primaryRawItemId: "x23-b",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x23-b"],
        stableKey: "present",
      },
    ],
  },
  {
    id: "24-complex-evidence-stack",
    description: "original, amplification, docs, and commentary with evidence stay in one event",
    items: [
      makeXItem({
        id: "x24-original",
        title: "Memory benchmark ships",
        rawText: "Benchmark ships with repo and docs.",
        links: [{ url: repoA }, { url: docA }],
      }),
      makeXItem({
        id: "x24-amplification",
        title: "Worth reading",
        rawText: "Worth reading if you build agents.",
        postType: "quote",
        quotedPostId: "x24-original",
        links: [{ url: docA }],
        publishedAt: at(11),
      }),
      makeWebItem({
        id: "w24-doc",
        url: docA,
        title: "Memory Benchmark Documentation",
        rawText: "Official docs for the benchmark.",
        publishedAt: at(12),
        links: [{ url: repoA }],
      }),
      makeXItem({
        id: "x24-commentary",
        handle: "observer",
        trusted: false,
        title: "Extra evidence on memory benchmark",
        rawText: "The benchmark evidence link is useful.",
        links: [{ url: docA }, { url: evidenceA }],
        publishedAt: at(13),
      }),
    ],
    expectedGroups: [
      {
        rawItemIds: ["x24-original", "x24-amplification", "w24-doc", "x24-commentary"],
        primaryRawItemId: "w24-doc",
        primarySourceRole: "primary_source",
        materialUpdateRawItemIds: ["x24-original", "w24-doc", "x24-commentary"],
        stableKey: "present",
      },
    ],
  },
];
