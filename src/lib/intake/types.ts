import type { SignalLane } from "@/types";
import type {
  IntakeIssueCode,
  IntakeIssueNote,
  IntakePlatform,
  IntakeRawPayloadMode,
  IntakeQuerySource,
  IntakeQueryStatus,
  IntakeRunType,
  IntakeSourceType,
  IntakeTriggerSource,
  RawItemLinkDiscoverySource,
  RawItemLinkRole,
  RawItemPersistenceAction,
} from "@/types";

export interface IntakeWindow {
  start: Date;
  end: Date;
}

export interface IntakeRuntimeConfig {
  refreshTargetHours: number;
  lookbackHours: number;
  maxItemsPerQuery: number;
  useMockProvider: boolean;
  logLevel: "silent" | "error" | "info" | "debug";
  rawPayload: {
    mode: IntakeRawPayloadMode;
    maxBytes: number;
  };
  xai: {
    apiKey?: string;
    baseUrl: string;
    model: string;
  };
}

export interface IntakeQueryPreset {
  id: string;
  laneHint?: SignalLane;
  queryText: string;
  allowedDomains?: string[];
}

export interface IntakeExecutableQuery {
  id: string;
  querySource: IntakeQuerySource;
  queryText: string;
  laneHint?: SignalLane;
  trustedAccountId?: string;
  trustedAccountHandle?: string;
  tool: "x_search" | "web_search";
  maxItems: number;
  allowedXHandles?: string[];
  excludedXHandles?: string[];
  allowedDomains?: string[];
  excludedDomains?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface NormalizedRawItemLink {
  discoveredVia: RawItemLinkDiscoverySource;
  linkRole: RawItemLinkRole;
  rawUrl: string;
  normalizedUrl: string;
  domain?: string | null;
  title?: string | null;
  position?: number | null;
}

export interface NormalizedRawItem {
  sourceType: IntakeSourceType;
  platform: IntakePlatform;
  externalId?: string | null;
  quotedExternalId?: string | null;
  repliedToExternalId?: string | null;
  sharedExternalId?: string | null;
  parentThreadExternalId?: string | null;
  dedupeKey: string;
  matchedTrustedAccountId?: string | null;
  authorHandle?: string | null;
  authorNormalizedHandle?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  title?: string | null;
  rawText?: string | null;
  normalizedText?: string | null;
  rawUrl: string;
  normalizedUrl: string;
  publishedAt?: string | null;
  collectedAt: string;
  languageCode?: string | null;
  laneHints: SignalLane[];
  itemKindHint?: string | null;
  isFromTrustedAccount: boolean;
  isRepost: boolean;
  isQuote: boolean;
  isReply: boolean;
  rawPayloadJson: Record<string, unknown>;
  metadataJson: Record<string, unknown>;
  extractedLinks: NormalizedRawItemLink[];
}

export interface RawProviderResult<TItem> {
  providerRequestId?: string | null;
  items: TItem[];
  requestPayload: Record<string, unknown>;
  responseSummary: Record<string, unknown>;
}

export interface ValidatedProviderItem<TItem> {
  itemIndex: number;
  item: TItem;
  rawItemJson: Record<string, unknown>;
}

export interface ValidatedProviderResult<TItem> {
  providerRequestId?: string | null;
  items: Array<ValidatedProviderItem<TItem>>;
  issues: IntakeIssueNote[];
  requestPayload: Record<string, unknown>;
  responseSummary: Record<string, unknown>;
  rawItemCount: number;
}

export interface PersistedRawItemResult {
  rawItemId: string;
  matchedTrustedAccountId?: string | null;
  persistenceAction: RawItemPersistenceAction;
  notes?: string | null;
}

export interface PersistedRawItemCounts {
  insertedCount: number;
  updatedCount: number;
  dedupedCount: number;
}

export interface RunIntakeOptions {
  runType?: IntakeRunType;
  triggerSource?: IntakeTriggerSource;
  mode?: "full" | "x" | "web";
  useMockProvider?: boolean;
}

export interface IntakeRunSummary {
  intakeRunId: string;
  status: "succeeded" | "partial" | "failed";
  queriesPlanned: number;
  queriesSucceeded: number;
  queriesFailed: number;
  rawItemsSeen: number;
  rawItemsInserted: number;
  rawItemsUpdated: number;
  rawItemsDeduped: number;
  rawItemsSkipped: number;
  usedMockProvider: boolean;
  refreshWindowStart: string;
  refreshWindowEnd: string;
}

export interface QueryProcessingResult {
  status: IntakeQueryStatus;
  resultCount: number;
  insertedCount: number;
  updatedCount: number;
  dedupedCount: number;
  skippedCount: number;
  issues: IntakeIssueNote[];
}

export interface InspectRawItemsFilters {
  limit: number;
  platform?: IntakePlatform;
  trustedOnly?: boolean;
  querySource?: IntakeQuerySource;
  recentHours?: number;
}

export interface RawItemInspection {
  rawItem: Record<string, unknown>;
  links: Record<string, unknown>[];
  observations: Array<{
    querySource?: IntakeQuerySource | null;
    observedAt: string;
    notes?: string | null;
  }>;
}

export interface QueryIssueSummary {
  code: IntakeIssueCode;
  message: string;
  itemIndex?: number | null;
}
