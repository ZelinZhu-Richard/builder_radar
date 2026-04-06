import type { SignalLane } from "./app";
import type { SourceKind, TrustTier } from "./source";

export type IntakeSourceType = "x_post" | "web_result";
export type IntakePlatform = "x" | "web";

export type IntakeRunType = "full" | "x_only" | "web_only" | "manual_replay";
export type IntakeTriggerSource = "cron" | "manual" | "api" | "dev";
export type IntakeRunStatus = "running" | "succeeded" | "partial" | "failed";

export type IntakeQuerySource = "trusted_account_x" | "x_search" | "web_search";
export type IntakeQueryStatus = "running" | "succeeded" | "partial" | "failed";

export type IntakeIssueCode =
  | "invalid_structured_output"
  | "invalid_item_shape"
  | "missing_required_field"
  | "invalid_url"
  | "normalization_error"
  | "persistence_error";

export type RawItemLinkDiscoverySource = "body" | "provider_field" | "web_result";
export type RawItemLinkRole =
  | "primary"
  | "evidence"
  | "citation"
  | "quote"
  | "media"
  | "profile"
  | "unknown";

export type RawItemPersistenceAction =
  | "inserted"
  | "updated"
  | "unchanged"
  | "skipped";

export interface IntakeIssueNote {
  code: IntakeIssueCode;
  message: string;
  itemIndex?: number | null;
  field?: string | null;
}

export interface TrustedAccount {
  id: string;
  platform: "x";
  externalAccountId?: string | null;
  handle: string;
  normalizedHandle: string;
  displayName?: string | null;
  profileUrl?: string | null;
  sourceKind: SourceKind;
  trustTier: TrustTier;
  laneHints: SignalLane[];
  topicTags: string[];
  ingestPriority: number;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeRun {
  id: string;
  runType: IntakeRunType;
  triggerSource: IntakeTriggerSource;
  status: IntakeRunStatus;
  refreshWindowStart?: string | null;
  refreshWindowEnd?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  accountsConsidered: number;
  queriesPlanned: number;
  queriesSucceeded: number;
  queriesFailed: number;
  rawItemsSeen: number;
  rawItemsInserted: number;
  rawItemsUpdated: number;
  rawItemsDeduped: number;
  rawItemsSkipped: number;
  errorSummary?: string | null;
  configSnapshotJson: Record<string, unknown>;
  createdAt: string;
}

export interface IntakeRunQuery {
  id: string;
  intakeRunId: string;
  querySource: IntakeQuerySource;
  laneHint?: SignalLane | null;
  trustedAccountId?: string | null;
  queryText: string;
  provider: "xai";
  providerRequestId?: string | null;
  cursor?: string | null;
  status: IntakeQueryStatus;
  startedAt: string;
  finishedAt?: string | null;
  resultCount: number;
  insertedCount: number;
  updatedCount: number;
  dedupedCount: number;
  skippedCount: number;
  errorMessage?: string | null;
  requestPayloadJson: Record<string, unknown>;
  responseSummaryJson: Record<string, unknown>;
}

export interface RawItem {
  id: string;
  sourceType: IntakeSourceType;
  platform: IntakePlatform;
  externalId?: string | null;
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
  firstSeenRunId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawItemLink {
  id: string;
  rawItemId: string;
  discoveredVia: RawItemLinkDiscoverySource;
  linkRole: RawItemLinkRole;
  rawUrl: string;
  normalizedUrl: string;
  domain?: string | null;
  title?: string | null;
  position?: number | null;
  createdAt: string;
}

export interface IntakeRunItem {
  id: string;
  intakeRunId: string;
  intakeRunQueryId: string;
  rawItemId: string;
  providerResultRank?: number | null;
  persistenceAction: RawItemPersistenceAction;
  matchedTrustedAccountId?: string | null;
  notes?: string | null;
  observedAt: string;
}
