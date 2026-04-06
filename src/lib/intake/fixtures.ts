import type {
  ValidatedXaiWebSearchItem,
  ValidatedXaiXSearchItem,
} from "@/lib/xai/types";

export const MOCK_X_SEARCH_RESULTS: ValidatedXaiXSearchItem[] = [
  {
    externalId: "mock-x-trace-benchmark",
    authorHandle: "modellab",
    authorName: "Model Lab Notes",
    authorProfileUrl: "https://x.com/modellab",
    permalinkUrl: "https://x.com/modellab/status/mock-x-trace-benchmark",
    rawText:
      "We just published a trace-level agent benchmark with reproducible failure cases and linked evaluation assets.",
    publishedAt: "2026-04-05T16:20:00Z",
    postType: "original",
    linkedUrls: [
      "https://example.com/benchmarks/agent-trace",
      "https://github.com/example/agent-trace-benchmark",
    ],
    laneHints: ["ai"],
    relevanceNote: "First-hand benchmark release with strong implementation value.",
  },
  {
    externalId: "mock-x-memory-layer",
    authorHandle: "systemsbuilder",
    authorName: "Systems Builder",
    authorProfileUrl: "https://x.com/systemsbuilder",
    permalinkUrl: "https://x.com/systemsbuilder/status/mock-x-memory-layer",
    rawText:
      "Shipping memory layer v2 today. Cleaner replay boundaries, less hidden state bleed, and better browser-agent traces.",
    publishedAt: "2026-04-05T17:42:00Z",
    postType: "original",
    linkedUrls: ["https://github.com/example/memory-layer-v2"],
    laneHints: ["builders", "ai"],
    relevanceNote: "Serious builder release with direct workflow value.",
  },
  {
    externalId: "mock-x-quant-note",
    authorHandle: "northset",
    authorName: "North Set Letter",
    authorProfileUrl: "https://x.com/northset",
    permalinkUrl: "https://x.com/northset/status/mock-x-quant-note",
    rawText:
      "Selective breadth is improving in AI tooling suppliers, but the move still looks tactical rather than structural.",
    publishedAt: "2026-04-05T15:52:00Z",
    postType: "original",
    linkedUrls: [],
    laneHints: ["quant"],
    relevanceNote: "Tactical quant signal with concrete regime framing.",
  },
  {
    externalId: "mock-x-recovery-note",
    authorHandle: "performancelab",
    authorName: "Performance Lab",
    authorProfileUrl: "https://x.com/performancelab",
    permalinkUrl: "https://x.com/performancelab/status/mock-x-recovery-note",
    rawText:
      "Late-evening training is compressing sleep. Move hard sessions earlier or accept lower next-day output quality.",
    publishedAt: "2026-04-05T13:12:00Z",
    postType: "original",
    linkedUrls: ["https://example.com/performance/recovery-window"],
    laneHints: ["performance"],
    relevanceNote: "Practical recovery signal with real behavior change attached.",
  },
  {
    externalId: "mock-x-design-partner",
    authorHandle: "systemsbuilder",
    authorName: "Systems Builder",
    authorProfileUrl: "https://x.com/systemsbuilder",
    permalinkUrl: "https://x.com/systemsbuilder/status/mock-x-design-partner",
    rawText:
      "Looking for three design partners running memory-heavy workflow agents in production. Need sharp operators, not tourists.",
    publishedAt: "2026-04-05T17:58:00Z",
    postType: "original",
    linkedUrls: ["https://example.com/apply/design-partner"],
    laneHints: ["builders"],
    relevanceNote: "Credible opportunity signal tied to a concrete next step.",
  },
];

export const MOCK_WEB_SEARCH_RESULTS: ValidatedXaiWebSearchItem[] = [
  {
    title: "Agent Trace Benchmark Release Notes",
    url: "https://example.com/benchmarks/agent-trace?utm_source=feed",
    domain: "example.com",
    sourceName: "Example Research",
    rawText:
      "Release notes for a trace-level agent benchmark with reproducible failure categories and downloadable evaluation assets.",
    publishedAt: "2026-04-05T16:24:00Z",
    linkedUrls: [
      "https://github.com/example/agent-trace-benchmark",
      "https://example.com/benchmarks/agent-trace/assets",
    ],
    laneHints: ["ai"],
    relevanceNote: "Official release page backing a first-hand benchmark post.",
  },
  {
    title: "Memory Layer v2 Documentation",
    url: "https://docs.example.com/memory-layer/v2",
    domain: "docs.example.com",
    sourceName: "Example Docs",
    rawText:
      "Documentation describing replay controls, browser-state boundaries, and trace instrumentation for memory-heavy workflow agents.",
    publishedAt: "2026-04-05T17:45:00Z",
    linkedUrls: ["https://github.com/example/memory-layer-v2"],
    laneHints: ["builders", "ai"],
    relevanceNote: "Docs page for a meaningful builder release.",
  },
  {
    title: "AI Infra Design Partner Program",
    url: "https://example.com/programs/design-partners",
    domain: "example.com",
    sourceName: "Example Programs",
    rawText:
      "Application page for a design partner call focused on operators running real workflow volume with strong feedback loops.",
    publishedAt: "2026-04-05T18:00:00Z",
    linkedUrls: ["https://example.com/programs/design-partners/apply"],
    laneHints: ["builders"],
    relevanceNote: "Clear opportunity page with direct next action.",
  },
  {
    title: "Recovery Scorecard for Focused Builders",
    url: "https://example.com/performance/recovery-scorecard",
    domain: "example.com",
    sourceName: "Performance Lab",
    rawText:
      "A practical weekly scorecard linking sleep quality, training load, focus blocks, and output consistency without fake hustle framing.",
    publishedAt: "2026-04-05T09:30:00Z",
    linkedUrls: [],
    laneHints: ["performance"],
    relevanceNote: "Practical performance content with clear implementation steps.",
  },
];
