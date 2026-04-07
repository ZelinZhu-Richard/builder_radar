import { MOCK_WEB_SEARCH_RESULTS, MOCK_X_SEARCH_RESULTS } from "@/lib/intake/fixtures";
import { getIntakeConfig, resolveUseMockProvider } from "@/lib/intake/config";
import type { IntakeExecutableQuery } from "@/lib/intake/types";
import type {
  XaiProviderResult,
  XaiResponsesApiResponse,
} from "./types";

interface SearchClient {
  searchXPosts(query: IntakeExecutableQuery): Promise<XaiProviderResult<unknown>>;
  searchWeb(query: IntakeExecutableQuery): Promise<XaiProviderResult<unknown>>;
}

const X_SEARCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          externalId: { type: "string" },
          quotedPostId: { type: "string" },
          repliedToPostId: { type: "string" },
          sharedPostId: { type: "string" },
          parentThreadId: { type: "string" },
          authorHandle: { type: "string" },
          authorName: { type: "string" },
          authorProfileUrl: { type: "string" },
          permalinkUrl: { type: "string" },
          rawText: { type: "string" },
          publishedAt: { type: "string" },
          postType: {
            type: "string",
            enum: ["original", "repost", "quote", "reply"],
          },
          linkedUrls: {
            type: "array",
            items: { type: "string" },
          },
          laneHints: {
            type: "array",
            items: { type: "string" },
          },
          relevanceNote: { type: "string" },
        },
        required: [
          "externalId",
          "authorHandle",
          "authorName",
          "authorProfileUrl",
          "permalinkUrl",
          "rawText",
          "publishedAt",
          "postType",
          "linkedUrls",
          "laneHints",
          "relevanceNote",
        ],
      },
    },
  },
  required: ["items"],
} as const;

const WEB_SEARCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          domain: { type: "string" },
          sourceName: { type: "string" },
          rawText: { type: "string" },
          publishedAt: { type: "string" },
          linkedUrls: {
            type: "array",
            items: { type: "string" },
          },
          laneHints: {
            type: "array",
            items: { type: "string" },
          },
          relevanceNote: { type: "string" },
        },
        required: [
          "title",
          "url",
          "domain",
          "sourceName",
          "rawText",
          "publishedAt",
          "linkedUrls",
          "laneHints",
          "relevanceNote",
        ],
      },
    },
  },
  required: ["items"],
} as const;

function extractOutputText(response: XaiResponsesApiResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  const outputText = response.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text");

  return outputText?.text ?? null;
}

function buildResponseSummary(response: XaiResponsesApiResponse) {
  return {
    responseId: response.id ?? null,
    model: response.model ?? null,
    usage: response.usage ?? {},
    citations: response.citations ?? [],
  };
}

function parseStructuredItems(
  response: XaiResponsesApiResponse,
) {
  const outputText = extractOutputText(response);
  if (!outputText) {
    throw new Error("xAI response did not include structured output text.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("xAI response did not include valid structured JSON output.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { items?: unknown[] }).items)
  ) {
    throw new Error("xAI response structured output is missing an items array.");
  }

  return (parsed as { items: unknown[] }).items;
}

function buildXSearchPrompt(query: IntakeExecutableQuery) {
  return [
    "You are extracting raw signal for a trust-first dashboard.",
    "Use X search and return discrete X posts, not trends, not merged events, and not summaries.",
    "Favor first-hand releases, implementation detail, workflows, opportunities, benchmarks, and credible tactical analysis.",
    "Exclude memes, jokes, vague hype, generic founder chatter, and duplicated low-value noise.",
    "If available, include quotedPostId, repliedToPostId, sharedPostId, and parentThreadId for relationship tracking.",
    `Return at most ${query.maxItems} posts.`,
    `Search instruction: ${query.queryText}`,
  ].join(" ");
}

function buildWebSearchPrompt(query: IntakeExecutableQuery) {
  return [
    "You are extracting raw signal for a trust-first dashboard.",
    "Use web search and return discrete web pages, not category summaries or merged events.",
    "Favor official docs, release notes, serious write-ups, program pages, repos, and practical implementation material.",
    "Exclude shallow listicles, hype pages, generic commentary, and low-substance productivity bait.",
    `Return at most ${query.maxItems} pages.`,
    `Search instruction: ${query.queryText}`,
  ].join(" ");
}

class LiveXaiSearchClient implements SearchClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  private async request({
    input,
    schema,
    tools,
  }: {
    input: string;
    schema: Record<string, unknown>;
    tools: Record<string, unknown>[];
  }) {
    const payload = {
      model: this.model,
      input: [
        {
          role: "user",
          content: input,
        },
      ],
      tools,
      text: {
        format: {
          type: "json_schema",
          name: "signal_intake_results",
          schema,
          strict: true,
        },
      },
    };

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`xAI request failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as XaiResponsesApiResponse;

    return {
      providerRequestId: data.id ?? null,
      items: parseStructuredItems(data),
      requestPayload: payload,
      responseSummary: buildResponseSummary(data),
    };
  }

  async searchXPosts(query: IntakeExecutableQuery) {
    return this.request({
      input: buildXSearchPrompt(query),
      schema: X_SEARCH_SCHEMA,
      tools: [
        {
          type: "x_search",
          allowed_x_handles: query.allowedXHandles,
          excluded_x_handles: query.excludedXHandles,
          from_date: query.fromDate,
          to_date: query.toDate,
        },
      ],
    });
  }

  async searchWeb(query: IntakeExecutableQuery) {
    return this.request({
      input: buildWebSearchPrompt(query),
      schema: WEB_SEARCH_SCHEMA,
      tools: [
        {
          type: "web_search",
          filters: {
            allowed_domains: query.allowedDomains,
            excluded_domains: query.excludedDomains,
          },
        },
      ],
    });
  }
}

class MockXaiSearchClient implements SearchClient {
  async searchXPosts(query: IntakeExecutableQuery) {
    const items =
      query.allowedXHandles && query.allowedXHandles.length > 0
        ? MOCK_X_SEARCH_RESULTS.filter((result) =>
            result.authorHandle
              ? query.allowedXHandles?.includes(result.authorHandle.toLowerCase())
              : false,
          ).slice(0, query.maxItems)
        : MOCK_X_SEARCH_RESULTS.filter((result) =>
            query.laneHint ? result.laneHints.includes(query.laneHint) : true,
          ).slice(0, query.maxItems);

    return {
      providerRequestId: `mock-x-${query.id}`,
      items,
      requestPayload: {
        mock: true,
        queryId: query.id,
        queryText: query.queryText,
      },
      responseSummary: {
        mock: true,
        queryId: query.id,
        resultCount: items.length,
      },
    };
  }

  async searchWeb(query: IntakeExecutableQuery) {
    const items = MOCK_WEB_SEARCH_RESULTS.filter((result) =>
      query.laneHint ? result.laneHints.includes(query.laneHint) : true,
    ).slice(0, query.maxItems);

    return {
      providerRequestId: `mock-web-${query.id}`,
      items,
      requestPayload: {
        mock: true,
        queryId: query.id,
        queryText: query.queryText,
      },
      responseSummary: {
        mock: true,
        queryId: query.id,
        resultCount: items.length,
      },
    };
  }
}

export function getXaiSearchClient({
  useMockProvider,
}: {
  useMockProvider?: boolean;
} = {}) {
  const config = getIntakeConfig();
  const shouldUseMock = resolveUseMockProvider(config, useMockProvider);

  if (shouldUseMock) {
    return new MockXaiSearchClient();
  }

  return new LiveXaiSearchClient(
    config.xai.apiKey!,
    config.xai.baseUrl,
    config.xai.model,
  );
}
