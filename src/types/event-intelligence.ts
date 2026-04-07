import type { EventStatus } from "./event";
import type { IntakeRunStatus, IntakeTriggerSource } from "./intake";
import type { SignalLane } from "./app";

export type EventSourceRole =
  | "primary_source"
  | "direct_participant"
  | "trusted_amplification"
  | "commentary"
  | "low_value_repetition";

export type EventTrait =
  | "first_hand"
  | "breaking"
  | "workflow"
  | "opportunity";

export type EventLinkRole =
  | "primary"
  | "official_doc"
  | "repo"
  | "paper"
  | "evidence"
  | "citation"
  | "opportunity"
  | "unknown";

export type EventAssignmentMethod =
  | "existing_membership"
  | "exact_anchor_link"
  | "stable_key"
  | "soft_match"
  | "new_event";

export type EventIntelligenceRunType =
  | "incremental"
  | "full"
  | "manual_replay";

export type EventResolutionAction =
  | "created_event"
  | "attached_existing"
  | "attached_existing_material"
  | "skipped_low_value"
  | "skipped_error";

export type EventManualOverrideAction =
  | "merge_event"
  | "pin_primary_raw_item"
  | "reassign_raw_item";

export interface CanonicalEvent {
  id: string;
  stableKey?: string | null;
  title: string;
  summary?: string | null;
  primaryLane: SignalLane;
  laneHints: SignalLane[];
  eventTraits: EventTrait[];
  eventKindHint?: string | null;
  status: EventStatus;
  primaryRawItemId: string;
  primarySourceRole: EventSourceRole;
  firstSeenAt: string;
  latestSeenAt: string;
  lastMaterialUpdateAt: string;
  memberCount: number;
  materialUpdateCount: number;
  mergedIntoEventId?: string | null;
  primaryRawItemOverrideId?: string | null;
  clusterExplanationJson: Record<string, unknown>;
  metadataJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EventItemMembership {
  id: string;
  eventId: string;
  rawItemId: string;
  sourceRole: EventSourceRole;
  isPrimary: boolean;
  isMaterialUpdate: boolean;
  assignmentMethod: EventAssignmentMethod;
  assignmentScore: number;
  reasonSummary?: string | null;
  metadataJson: Record<string, unknown>;
  firstAttachedAt: string;
  updatedAt: string;
}

export interface EventLink {
  id: string;
  eventId: string;
  rawItemLinkId?: string | null;
  sourceRawItemId?: string | null;
  rawUrl: string;
  normalizedUrl: string;
  domain?: string | null;
  title?: string | null;
  linkRole: EventLinkRole;
  provenanceCount: number;
  isCanonical: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  metadataJson: Record<string, unknown>;
}

export interface EventIntelligenceRun {
  id: string;
  runType: EventIntelligenceRunType;
  triggerSource: IntakeTriggerSource;
  status: IntakeRunStatus;
  candidateRawItems: number;
  processedItems: number;
  eventsCreated: number;
  eventsUpdated: number;
  itemsAttached: number;
  itemsSkipped: number;
  startedAt: string;
  finishedAt?: string | null;
  errorSummary?: string | null;
  configSnapshotJson: Record<string, unknown>;
  createdAt: string;
}

export interface EventIntelligenceRunItem {
  id: string;
  eventIntelligenceRunId: string;
  rawItemId: string;
  eventId?: string | null;
  resolutionAction: EventResolutionAction;
  assignedRole?: EventSourceRole | null;
  assignmentMethod?: EventAssignmentMethod | null;
  assignmentScore?: number | null;
  runnerUpEventId?: string | null;
  runnerUpScore?: number | null;
  ambiguityFlag: boolean;
  ambiguityReason?: string | null;
  notes?: string | null;
  decisionJson: Record<string, unknown>;
  processedAt: string;
}

export interface EventManualOverride {
  id: string;
  actionType: EventManualOverrideAction;
  eventId?: string | null;
  targetEventId?: string | null;
  rawItemId?: string | null;
  primaryRawItemId?: string | null;
  reason: string;
  payloadJson: Record<string, unknown>;
  appliedAt: string;
  createdAt: string;
}
