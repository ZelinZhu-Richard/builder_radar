import type { Database } from "@/lib/supabase/database.types";
import type {
  EventAssignmentMethod,
  EventManualOverrideAction,
  EventIntelligenceRunType,
  EventLinkRole,
  EventResolutionAction,
  EventSourceRole,
  EventTrait,
  IntakeRunStatus,
  IntakeTriggerSource,
  SignalLane,
} from "@/types";

export type CanonicalEventRow = Database["public"]["Tables"]["canonical_events"]["Row"];
export type EventLinkRow = Database["public"]["Tables"]["event_links"]["Row"];
export type EventRawItemRow = Database["public"]["Tables"]["event_raw_items"]["Row"];
export type EventIntelligenceRunRow = Database["public"]["Tables"]["event_intelligence_runs"]["Row"];
export type EventIntelligenceRunItemRow =
  Database["public"]["Tables"]["event_intelligence_run_items"]["Row"];
export type EventManualOverrideRow =
  Database["public"]["Tables"]["event_manual_overrides"]["Row"];
export type RawItemRow = Database["public"]["Tables"]["raw_items"]["Row"];
export type RawItemLinkRow = Database["public"]["Tables"]["raw_item_links"]["Row"];

export interface EventIntelligenceRuntimeConfig {
  maxCandidateEvents: number;
  softMatchLookbackDays: number;
  longMatchLookbackDays: number;
  breakingWindowHours: number;
  logLevel: "silent" | "error" | "info" | "debug";
}

export interface RunEventIntelligenceOptions {
  runType?: EventIntelligenceRunType;
  triggerSource?: IntakeTriggerSource;
}

export interface EventIntelligenceRunSummary {
  eventIntelligenceRunId: string;
  status: IntakeRunStatus;
  candidateRawItems: number;
  processedItems: number;
  eventsCreated: number;
  eventsUpdated: number;
  itemsAttached: number;
  itemsSkipped: number;
}

export interface EventIntelligenceRawItemCandidate {
  rawItem: RawItemRow;
  rawItemLinks: RawItemLinkRow[];
  existingMembership: EventRawItemRow | null;
}

export interface CandidateEventContext {
  event: CanonicalEventRow;
  primaryRawItem: RawItemRow | null;
  memberships: EventRawItemRow[];
  rawItems: RawItemRow[];
  eventLinks: EventLinkRow[];
}

export interface TokenSignature {
  tokens: string[];
  hash: string;
}

export interface PromotedEventLinkCandidate {
  rawItemLinkId?: string | null;
  sourceRawItemId: string;
  rawUrl: string;
  normalizedUrl: string;
  domain?: string | null;
  title?: string | null;
  linkRole: EventLinkRole;
  isCanonical: boolean;
  reason: string;
}

export interface EventRoleDecision {
  sourceRole: EventSourceRole;
  isMaterialUpdate: boolean;
  isLowValue: boolean;
  reasonSummary: string;
}

export interface EventMatchCandidate {
  eventId: string;
  method: EventAssignmentMethod;
  score: number;
  reasons: string[];
}

export interface EventMatchDecision {
  matchedEventId: string | null;
  method: EventAssignmentMethod;
  score: number;
  reasons: string[];
  runnerUpEventId: string | null;
  runnerUpScore: number;
  ambiguityFlag: boolean;
  ambiguityReason: "below_threshold" | "low_margin" | "conflicting_anchor" | null;
}

export interface EventRefreshResult {
  primaryRawItemId: string;
  primarySourceRole: EventSourceRole;
  title: string;
  summary: string | null;
  primaryLane: SignalLane;
  laneHints: SignalLane[];
  eventTraits: EventTrait[];
  eventKindHint: string | null;
  status: "new" | "developing" | "steady" | "archived";
  latestSeenAt: string;
  lastMaterialUpdateAt: string;
  memberCount: number;
  materialUpdateCount: number;
  stableKey: string | null;
  clusterExplanationJson: Record<string, unknown>;
  metadataJson: Record<string, unknown>;
}

export interface EventProcessingOutcome {
  resolutionAction: EventResolutionAction;
  eventId: string | null;
  assignedRole: EventSourceRole | null;
  assignmentMethod: EventAssignmentMethod | null;
  assignmentScore: number | null;
  runnerUpEventId: string | null;
  runnerUpScore: number | null;
  ambiguityFlag: boolean;
  ambiguityReason: string | null;
  notes: string | null;
  decisionJson: Record<string, unknown>;
  eventCreated: boolean;
  eventUpdated: boolean;
  itemAttached: boolean;
  itemSkipped: boolean;
}

export interface ApplyEventManualOverrideOptions {
  actionType: EventManualOverrideAction;
  eventId?: string | null;
  targetEventId?: string | null;
  rawItemId?: string | null;
  primaryRawItemId?: string | null;
  reason: string;
  payloadJson?: Record<string, unknown>;
}
