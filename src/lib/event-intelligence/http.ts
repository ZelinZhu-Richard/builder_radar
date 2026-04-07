import { NextResponse, type NextRequest } from "next/server";
import type {
  EventIntelligenceRunType,
  EventManualOverrideAction,
  IntakeTriggerSource,
} from "@/types";

const VALID_TRIGGER_SOURCES = new Set<IntakeTriggerSource>([
  "cron",
  "manual",
  "api",
  "dev",
]);

const VALID_RUN_TYPES = new Set<EventIntelligenceRunType>([
  "incremental",
  "full",
  "manual_replay",
]);

const VALID_OVERRIDE_ACTIONS = new Set<EventManualOverrideAction>([
  "merge_event",
  "pin_primary_raw_item",
  "reassign_raw_item",
]);

function asOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export class EventIntelligenceRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "EventIntelligenceRequestError";
  }
}

export async function parseManualEventIntelligenceRequest(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    triggerSource?: unknown;
    runType?: unknown;
  };

  if (
    body.triggerSource != null &&
    (typeof body.triggerSource !== "string" ||
      !VALID_TRIGGER_SOURCES.has(body.triggerSource as IntakeTriggerSource))
  ) {
    throw new EventIntelligenceRequestError("Invalid event intelligence triggerSource.");
  }

  if (
    body.runType != null &&
    (typeof body.runType !== "string" ||
      !VALID_RUN_TYPES.has(body.runType as EventIntelligenceRunType))
  ) {
    throw new EventIntelligenceRequestError("Invalid event intelligence runType.");
  }

  return {
    triggerSource: body.triggerSource as IntakeTriggerSource | undefined,
    runType: body.runType as EventIntelligenceRunType | undefined,
  };
}

export async function parseEventManualOverrideRequest(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    actionType?: unknown;
    eventId?: unknown;
    targetEventId?: unknown;
    rawItemId?: unknown;
    primaryRawItemId?: unknown;
    reason?: unknown;
    payloadJson?: unknown;
  };

  if (
    typeof body.actionType !== "string" ||
    !VALID_OVERRIDE_ACTIONS.has(body.actionType as EventManualOverrideAction)
  ) {
    throw new EventIntelligenceRequestError("Invalid event intelligence override actionType.");
  }

  const reason = asOptionalString(body.reason);
  if (!reason) {
    throw new EventIntelligenceRequestError("Event intelligence overrides require a reason.");
  }

  if (
    body.payloadJson != null &&
    (typeof body.payloadJson !== "object" || Array.isArray(body.payloadJson))
  ) {
    throw new EventIntelligenceRequestError("payloadJson must be an object when provided.");
  }

  return {
    actionType: body.actionType as EventManualOverrideAction,
    eventId: asOptionalString(body.eventId),
    targetEventId: asOptionalString(body.targetEventId),
    rawItemId: asOptionalString(body.rawItemId),
    primaryRawItemId: asOptionalString(body.primaryRawItemId),
    reason,
    payloadJson: (body.payloadJson ?? {}) as Record<string, unknown>,
  };
}

export function parseRunLimitParam(value: string | null, defaultValue = 20) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new EventIntelligenceRequestError("Invalid limit query parameter.");
  }

  return Math.min(parsed, 100);
}

export function getEventIntelligenceErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown event intelligence error.";

  if (error instanceof EventIntelligenceRequestError) {
    return NextResponse.json({ ok: false, error: message }, { status: error.status });
  }

  if (error instanceof Error && error.name === "UnauthorizedError") {
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }

  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}
