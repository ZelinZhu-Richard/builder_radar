import { NextResponse, type NextRequest } from "next/server";
import type { IntakePlatform, IntakeQuerySource, IntakeTriggerSource } from "@/types";

const VALID_TRIGGER_SOURCES = new Set<IntakeTriggerSource>([
  "cron",
  "manual",
  "api",
  "dev",
]);

const VALID_PLATFORMS = new Set<IntakePlatform>(["x", "web"]);
const VALID_QUERY_SOURCES = new Set<IntakeQuerySource>([
  "trusted_account_x",
  "x_search",
  "web_search",
]);

export class IntakeRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "IntakeRequestError";
  }
}

function parseBoolean(value: unknown) {
  if (typeof value !== "boolean") {
    return undefined;
  }

  return value;
}

export async function parseManualIntakeRequest(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    triggerSource?: unknown;
    useMockProvider?: unknown;
  };

  if (
    body.triggerSource != null &&
    (typeof body.triggerSource !== "string" ||
      !VALID_TRIGGER_SOURCES.has(body.triggerSource as IntakeTriggerSource))
  ) {
    throw new IntakeRequestError("Invalid intake triggerSource.");
  }

  if (
    body.useMockProvider != null &&
    typeof body.useMockProvider !== "boolean"
  ) {
    throw new IntakeRequestError("Invalid intake useMockProvider flag.");
  }

  return {
    triggerSource: body.triggerSource as IntakeTriggerSource | undefined,
    useMockProvider: parseBoolean(body.useMockProvider),
  };
}

export function parsePositiveIntParam(
  value: string | null,
  {
    defaultValue,
    maxValue,
    field,
  }: {
    defaultValue: number;
    maxValue: number;
    field: string;
  },
) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new IntakeRequestError(`Invalid ${field} value.`);
  }

  return Math.min(parsed, maxValue);
}

export function parseBooleanParam(value: string | null) {
  if (value == null) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new IntakeRequestError("Invalid boolean query parameter.");
}

export function parsePlatformParam(value: string | null) {
  if (value == null) {
    return undefined;
  }

  if (!VALID_PLATFORMS.has(value as IntakePlatform)) {
    throw new IntakeRequestError("Invalid platform filter.");
  }

  return value as IntakePlatform;
}

export function parseQuerySourceParam(value: string | null) {
  if (value == null) {
    return undefined;
  }

  if (!VALID_QUERY_SOURCES.has(value as IntakeQuerySource)) {
    throw new IntakeRequestError("Invalid querySource filter.");
  }

  return value as IntakeQuerySource;
}

export function getIntakeErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown intake error";

  if (error instanceof IntakeRequestError) {
    return NextResponse.json({ ok: false, error: message }, { status: error.status });
  }

  if (error instanceof Error && error.name === "UnauthorizedError") {
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }

  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}
