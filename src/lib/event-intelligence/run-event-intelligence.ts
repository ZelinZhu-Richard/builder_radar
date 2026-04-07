import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  EventAssignmentMethod,
  EventIntelligenceRunType,
  EventResolutionAction,
  EventSourceRole,
  IntakeRunStatus,
} from "@/types";
import { getHighSignalAnchorLinks } from "./links";
import { rawItemHasDirectRelationToEvent } from "./relationships";
import {
  chooseEventMatch,
  getTokenOverlapForEvent,
  isCandidateWithinLookback,
  scoreEventMatch,
  buildPromotedEventLinks,
} from "./heuristics";
import { getEventIntelligenceConfig, snapshotEventIntelligenceConfig } from "./config";
import { createEventIntelligenceLogger } from "./logger";
import {
  createCanonicalEventFromSeed,
  createEventIntelligenceRun,
  getCanonicalEventDetails,
  insertEventIntelligenceRunItem,
  loadAllEventContexts,
  loadCandidateRawItems,
  loadEventContext,
  refreshCanonicalEventState,
  updateEventIntelligenceRun,
  upsertEventLinks,
  upsertEventMembership,
} from "./persist";
import { determineSourceRole } from "./source-roles";
import type {
  CandidateEventContext,
  EventIntelligenceRunSummary,
  EventIntelligenceRawItemCandidate,
  RunEventIntelligenceOptions,
} from "./types";

function deriveRunType(
  runType?: RunEventIntelligenceOptions["runType"],
): EventIntelligenceRunType {
  return runType ?? "incremental";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown event intelligence error.";
}

function buildRoleMetadata({
  eventId,
  reasons,
  runnerUpEventId,
  runnerUpScore,
  ambiguityFlag,
  ambiguityReason,
}: {
  eventId?: string | null;
  reasons: string[];
  runnerUpEventId?: string | null;
  runnerUpScore?: number;
  ambiguityFlag?: boolean;
  ambiguityReason?: string | null;
}) {
  return {
    matchedEventId: eventId ?? null,
    reasons,
    runnerUpEventId: runnerUpEventId ?? null,
    runnerUpScore: runnerUpScore ?? null,
    ambiguityFlag: ambiguityFlag ?? false,
    ambiguityReason: ambiguityReason ?? null,
  } as Json;
}

function buildDecisionJson({
  eventId,
  assignedRole,
  assignmentMethod,
  assignmentScore,
  reasons,
  rawItemId,
  runnerUpEventId,
  runnerUpScore,
  ambiguityFlag,
  ambiguityReason,
}: {
  eventId?: string | null;
  assignedRole?: EventSourceRole | null;
  assignmentMethod?: EventAssignmentMethod | null;
  assignmentScore?: number | null;
  reasons: string[];
  rawItemId: string;
  runnerUpEventId?: string | null;
  runnerUpScore?: number | null;
  ambiguityFlag?: boolean;
  ambiguityReason?: string | null;
}) {
  return {
    rawItemId,
    eventId: eventId ?? null,
    assignedRole: assignedRole ?? null,
    assignmentMethod: assignmentMethod ?? null,
    assignmentScore: assignmentScore ?? null,
    runnerUpEventId: runnerUpEventId ?? null,
    runnerUpScore: runnerUpScore ?? null,
    ambiguityFlag: ambiguityFlag ?? false,
    ambiguityReason: ambiguityReason ?? null,
    reasons,
  } as Json;
}

function hasAnchorOverlap(candidate: EventIntelligenceRawItemCandidate, event: CandidateEventContext) {
  const anchorUrls = new Set(
    getHighSignalAnchorLinks(buildPromotedEventLinks(candidate.rawItem, candidate.rawItemLinks)).map(
      (link) => link.normalizedUrl,
    ),
  );

  if (anchorUrls.size === 0) {
    return false;
  }

  return event.eventLinks.some((eventLink) => anchorUrls.has(eventLink.normalized_url));
}

function hasRelationOverlap(
  candidate: EventIntelligenceRawItemCandidate,
  event: CandidateEventContext,
) {
  return rawItemHasDirectRelationToEvent(candidate.rawItem, event.rawItems);
}

function selectCandidateEvents({
  candidate,
  eventContexts,
  softMatchLookbackDays,
  longMatchLookbackDays,
  maxCandidateEvents,
}: {
  candidate: EventIntelligenceRawItemCandidate;
  eventContexts: Map<string, CandidateEventContext>;
  softMatchLookbackDays: number;
  longMatchLookbackDays: number;
  maxCandidateEvents: number;
}) {
  const promotedLinks = buildPromotedEventLinks(candidate.rawItem, candidate.rawItemLinks);
  const relationCandidates: CandidateEventContext[] = [];
  const anchorOverlapCandidates: CandidateEventContext[] = [];
  const softCandidates: CandidateEventContext[] = [];

  for (const event of eventContexts.values()) {
    if (candidate.existingMembership?.event_id === event.event.id) {
      return [event];
    }

    if (hasRelationOverlap(candidate, event)) {
      relationCandidates.push(event);
      continue;
    }

    if (hasAnchorOverlap(candidate, event)) {
      anchorOverlapCandidates.push(event);
      continue;
    }

    const laneOverlap =
      candidate.rawItem.lane_hints.length === 0 ||
      candidate.rawItem.lane_hints.some(
        (lane) =>
          event.event.primary_lane === lane || event.event.lane_hints.includes(lane),
      );

    if (!laneOverlap) {
      continue;
    }

    if (
      isCandidateWithinLookback({
        rawItem: candidate.rawItem,
        promotedLinks,
        event,
        softMatchLookbackDays,
        longMatchLookbackDays,
      })
    ) {
      softCandidates.push(event);
    }
  }

  return [...relationCandidates, ...anchorOverlapCandidates, ...softCandidates].slice(
    0,
    maxCandidateEvents,
  );
}

function buildFinalStatus({
  processedItems,
  hadErrors,
}: {
  processedItems: number;
  hadErrors: boolean;
}): IntakeRunStatus {
  if (processedItems === 0 && hadErrors) {
    return "failed";
  }

  if (hadErrors) {
    return "partial";
  }

  return "succeeded";
}

export async function runEventIntelligence(
  options: RunEventIntelligenceOptions = {},
): Promise<EventIntelligenceRunSummary> {
  const supabase = getSupabaseAdminClient();
  const config = getEventIntelligenceConfig();
  const runType = deriveRunType(options.runType);
  const triggerSource = options.triggerSource ?? "api";
  const [rawItemCandidates, eventContexts] = await Promise.all([
    loadCandidateRawItems(supabase, { runType }),
    loadAllEventContexts(supabase),
  ]);
  const run = await createEventIntelligenceRun(supabase, {
    run_type: runType,
    trigger_source: triggerSource,
    status: "running",
    candidate_raw_items: rawItemCandidates.length,
    config_snapshot_json: snapshotEventIntelligenceConfig(config) as Json,
  });
  const logger = createEventIntelligenceLogger({
    runId: run.id,
  });

  logger.info("event_intelligence_run_started", {
    candidateRawItems: rawItemCandidates.length,
    runType,
  });

  let processedItems = 0;
  let eventsCreated = 0;
  let eventsUpdated = 0;
  let itemsAttached = 0;
  let itemsSkipped = 0;
  let hadErrors = false;
  const runIssues: string[] = [];

  for (const candidate of rawItemCandidates) {
    const itemLogger = logger.child({
      rawItemId: candidate.rawItem.id,
    });

    try {
      const promotedLinks = buildPromotedEventLinks(
        candidate.rawItem,
        candidate.rawItemLinks,
      );

      if (candidate.existingMembership) {
        const existingEvent =
          eventContexts.get(candidate.existingMembership.event_id) ??
          (await loadEventContext(supabase, candidate.existingMembership.event_id));

        if (!existingEvent) {
          throw new Error(
            `Existing membership references missing event ${candidate.existingMembership.event_id}.`,
          );
        }

        const tokenOverlap = getTokenOverlapForEvent(candidate.rawItem, existingEvent);
        const roleDecision = determineSourceRole({
          rawItem: candidate.rawItem,
          event: existingEvent,
          promotedLinks,
          tokenOverlap,
        });

        await upsertEventMembership(supabase, {
          event_id: existingEvent.event.id,
          raw_item_id: candidate.rawItem.id,
          source_role: roleDecision.sourceRole,
          is_primary: existingEvent.event.primary_raw_item_id === candidate.rawItem.id,
          is_material_update: roleDecision.isMaterialUpdate,
          assignment_method: "existing_membership",
          assignment_score: 100,
          reason_summary: roleDecision.reasonSummary,
          metadata_json: buildRoleMetadata({
            eventId: existingEvent.event.id,
            reasons: ["existing_membership"],
            ambiguityFlag: false,
            ambiguityReason: null,
          }),
        });
        await upsertEventLinks(supabase, existingEvent.event.id, promotedLinks);
        const refreshed = await refreshCanonicalEventState(supabase, {
          eventId: existingEvent.event.id,
          breakingWindowHours: config.breakingWindowHours,
          latestAssignmentMethod: "existing_membership",
        });
        const refreshedContext = await loadEventContext(supabase, existingEvent.event.id);

        if (refreshedContext) {
          eventContexts.set(existingEvent.event.id, refreshedContext);
        }

        processedItems += 1;
        itemsAttached += 1;
        if (refreshed.changed) {
          eventsUpdated += 1;
        }

        const resolutionAction: EventResolutionAction = roleDecision.isMaterialUpdate
          ? "attached_existing_material"
          : "attached_existing";
        await insertEventIntelligenceRunItem(supabase, {
          event_intelligence_run_id: run.id,
          raw_item_id: candidate.rawItem.id,
          event_id: existingEvent.event.id,
          resolution_action: resolutionAction,
          assigned_role: roleDecision.sourceRole,
          assignment_method: "existing_membership",
          assignment_score: 100,
          runner_up_event_id: null,
          runner_up_score: null,
          ambiguity_flag: false,
          ambiguity_reason: null,
          notes: roleDecision.reasonSummary,
          decision_json: buildDecisionJson({
            eventId: existingEvent.event.id,
            assignedRole: roleDecision.sourceRole,
            assignmentMethod: "existing_membership",
            assignmentScore: 100,
            reasons: ["existing_membership"],
            rawItemId: candidate.rawItem.id,
            ambiguityFlag: false,
            ambiguityReason: null,
          }),
        });

        itemLogger.info("event_item_reprocessed", {
          eventId: existingEvent.event.id,
          role: roleDecision.sourceRole,
          resolutionAction,
        });
        continue;
      }

      const candidateEvents = selectCandidateEvents({
        candidate,
        eventContexts,
        softMatchLookbackDays: config.softMatchLookbackDays,
        longMatchLookbackDays: config.longMatchLookbackDays,
        maxCandidateEvents: config.maxCandidateEvents,
      });
      const matches = candidateEvents.map((event) =>
        scoreEventMatch({
          rawItem: candidate.rawItem,
          promotedLinks,
          event,
        }),
      );
      const matchDecision = chooseEventMatch(matches);

      if (matchDecision.matchedEventId) {
        const matchedEvent = eventContexts.get(matchDecision.matchedEventId);

        if (!matchedEvent) {
          throw new Error(`Matched event ${matchDecision.matchedEventId} is missing from cache.`);
        }

        const tokenOverlap = getTokenOverlapForEvent(candidate.rawItem, matchedEvent);
        const roleDecision = determineSourceRole({
          rawItem: candidate.rawItem,
          event: matchedEvent,
          promotedLinks,
          tokenOverlap,
        });

        await upsertEventMembership(supabase, {
          event_id: matchedEvent.event.id,
          raw_item_id: candidate.rawItem.id,
          source_role: roleDecision.sourceRole,
          is_primary: false,
          is_material_update: roleDecision.isMaterialUpdate,
          assignment_method: matchDecision.method,
          assignment_score: matchDecision.score,
          reason_summary: roleDecision.reasonSummary,
          metadata_json: buildRoleMetadata({
            eventId: matchedEvent.event.id,
            reasons: matchDecision.reasons,
            runnerUpEventId: matchDecision.runnerUpEventId,
            runnerUpScore: matchDecision.runnerUpScore,
            ambiguityFlag: matchDecision.ambiguityFlag,
            ambiguityReason: matchDecision.ambiguityReason,
          }),
        });
        await upsertEventLinks(supabase, matchedEvent.event.id, promotedLinks);
        const refreshed = await refreshCanonicalEventState(supabase, {
          eventId: matchedEvent.event.id,
          breakingWindowHours: config.breakingWindowHours,
          latestAssignmentMethod: matchDecision.method,
        });
        const refreshedContext = await loadEventContext(supabase, matchedEvent.event.id);

        if (refreshedContext) {
          eventContexts.set(matchedEvent.event.id, refreshedContext);
        }

        processedItems += 1;
        itemsAttached += 1;
        if (refreshed.changed) {
          eventsUpdated += 1;
        }

        const resolutionAction: EventResolutionAction = roleDecision.isMaterialUpdate
          ? "attached_existing_material"
          : "attached_existing";
        await insertEventIntelligenceRunItem(supabase, {
          event_intelligence_run_id: run.id,
          raw_item_id: candidate.rawItem.id,
          event_id: matchedEvent.event.id,
          resolution_action: resolutionAction,
          assigned_role: roleDecision.sourceRole,
          assignment_method: matchDecision.method,
          assignment_score: matchDecision.score,
          runner_up_event_id: matchDecision.runnerUpEventId,
          runner_up_score: matchDecision.runnerUpScore,
          ambiguity_flag: matchDecision.ambiguityFlag,
          ambiguity_reason: matchDecision.ambiguityReason,
          notes: roleDecision.reasonSummary,
          decision_json: buildDecisionJson({
            eventId: matchedEvent.event.id,
            assignedRole: roleDecision.sourceRole,
            assignmentMethod: matchDecision.method,
            assignmentScore: matchDecision.score,
            reasons: matchDecision.reasons,
            rawItemId: candidate.rawItem.id,
            runnerUpEventId: matchDecision.runnerUpEventId,
            runnerUpScore: matchDecision.runnerUpScore,
            ambiguityFlag: matchDecision.ambiguityFlag,
            ambiguityReason: matchDecision.ambiguityReason,
          }),
        });

        itemLogger.info("event_item_attached", {
          eventId: matchedEvent.event.id,
          assignmentMethod: matchDecision.method,
          assignmentScore: matchDecision.score,
          role: roleDecision.sourceRole,
          resolutionAction,
        });
        continue;
      }

      const roleDecision = determineSourceRole({
        rawItem: candidate.rawItem,
        promotedLinks,
        tokenOverlap: 0,
      });

      if (roleDecision.isLowValue && getHighSignalAnchorLinks(promotedLinks).length === 0) {
        processedItems += 1;
        itemsSkipped += 1;
        await insertEventIntelligenceRunItem(supabase, {
          event_intelligence_run_id: run.id,
          raw_item_id: candidate.rawItem.id,
          event_id: null,
          resolution_action: "skipped_low_value",
          assigned_role: roleDecision.sourceRole,
          assignment_method: null,
          assignment_score: null,
          runner_up_event_id: matchDecision.runnerUpEventId,
          runner_up_score: matchDecision.runnerUpScore,
          ambiguity_flag: matchDecision.ambiguityFlag,
          ambiguity_reason: matchDecision.ambiguityReason,
          notes: roleDecision.reasonSummary,
          decision_json: buildDecisionJson({
            assignedRole: roleDecision.sourceRole,
            assignmentMethod: null,
            assignmentScore: null,
            reasons: ["low_value_without_anchor"],
            rawItemId: candidate.rawItem.id,
            runnerUpEventId: matchDecision.runnerUpEventId,
            runnerUpScore: matchDecision.runnerUpScore,
            ambiguityFlag: matchDecision.ambiguityFlag,
            ambiguityReason: matchDecision.ambiguityReason,
          }),
        });

        itemLogger.info("event_item_skipped", {
          reason: roleDecision.reasonSummary,
        });
        continue;
      }

      const created = await createCanonicalEventFromSeed(supabase, {
        rawItem: candidate.rawItem,
        rawItemLinks: candidate.rawItemLinks,
        roleDecision,
        breakingWindowHours: config.breakingWindowHours,
      });

      await upsertEventMembership(supabase, {
        event_id: created.event.id,
        raw_item_id: candidate.rawItem.id,
        source_role: roleDecision.sourceRole,
        is_primary: true,
        is_material_update: roleDecision.isMaterialUpdate,
        assignment_method: "new_event",
        assignment_score: 100,
        reason_summary: roleDecision.reasonSummary,
        metadata_json: buildRoleMetadata({
          eventId: created.event.id,
          reasons: ["new_event"],
        }),
      });
      await upsertEventLinks(supabase, created.event.id, created.promotedLinks);
      await refreshCanonicalEventState(supabase, {
        eventId: created.event.id,
        breakingWindowHours: config.breakingWindowHours,
        latestAssignmentMethod: "new_event",
      });
      const createdContext = await loadEventContext(supabase, created.event.id);

      if (createdContext) {
        eventContexts.set(created.event.id, createdContext);
      }

      processedItems += 1;
      eventsCreated += 1;
      itemsAttached += 1;
      await insertEventIntelligenceRunItem(supabase, {
        event_intelligence_run_id: run.id,
        raw_item_id: candidate.rawItem.id,
        event_id: created.event.id,
        resolution_action: "created_event",
        assigned_role: roleDecision.sourceRole,
        assignment_method: "new_event",
        assignment_score: 100,
        runner_up_event_id: matchDecision.runnerUpEventId,
        runner_up_score: matchDecision.runnerUpScore,
        ambiguity_flag: matchDecision.ambiguityFlag,
        ambiguity_reason: matchDecision.ambiguityReason,
        notes: roleDecision.reasonSummary,
        decision_json: buildDecisionJson({
          eventId: created.event.id,
          assignedRole: roleDecision.sourceRole,
          assignmentMethod: "new_event",
          assignmentScore: 100,
          reasons: ["new_event"],
          rawItemId: candidate.rawItem.id,
          runnerUpEventId: matchDecision.runnerUpEventId,
          runnerUpScore: matchDecision.runnerUpScore,
          ambiguityFlag: matchDecision.ambiguityFlag,
          ambiguityReason: matchDecision.ambiguityReason,
        }),
      });

      itemLogger.info("event_created", {
        eventId: created.event.id,
        role: roleDecision.sourceRole,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      hadErrors = true;
      processedItems += 1;
      itemsSkipped += 1;
      runIssues.push(`${candidate.rawItem.id}:${message}`);

      await insertEventIntelligenceRunItem(supabase, {
        event_intelligence_run_id: run.id,
        raw_item_id: candidate.rawItem.id,
        event_id: null,
        resolution_action: "skipped_error",
        assigned_role: null,
        assignment_method: null,
        assignment_score: null,
        runner_up_event_id: null,
        runner_up_score: null,
        ambiguity_flag: false,
        ambiguity_reason: null,
        notes: message,
        decision_json: buildDecisionJson({
          assignmentMethod: null,
          assignmentScore: null,
          reasons: ["processing_error"],
          rawItemId: candidate.rawItem.id,
          ambiguityFlag: false,
          ambiguityReason: null,
        }),
      });

      logger.error("event_item_processing_failed", {
        rawItemId: candidate.rawItem.id,
        error: message,
      });
    }
  }

  const finalStatus = buildFinalStatus({
    processedItems,
    hadErrors,
  });

  await updateEventIntelligenceRun(supabase, run.id, {
    status: finalStatus,
    processed_items: processedItems,
    events_created: eventsCreated,
    events_updated: eventsUpdated,
    items_attached: itemsAttached,
    items_skipped: itemsSkipped,
    finished_at: new Date().toISOString(),
    error_summary: runIssues.length > 0 ? runIssues.slice(0, 10).join(" | ") : null,
  });

  logger.info("event_intelligence_run_finished", {
    status: finalStatus,
    processedItems,
    eventsCreated,
    eventsUpdated,
    itemsAttached,
    itemsSkipped,
  });

  return {
    eventIntelligenceRunId: run.id,
    status: finalStatus,
    candidateRawItems: rawItemCandidates.length,
    processedItems,
    eventsCreated,
    eventsUpdated,
    itemsAttached,
    itemsSkipped,
  };
}

export async function inspectCanonicalEvent(eventId: string) {
  return getCanonicalEventDetails(getSupabaseAdminClient(), eventId);
}
