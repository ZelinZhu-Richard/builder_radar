import type { EventAssignmentMethod, EventSourceRole } from "@/types";
import { getEventIntelligenceLogLevel } from "./config";

type LogLevel = "error" | "info" | "debug";

interface EventIntelligenceLogContext {
  runId?: string;
  eventId?: string;
  rawItemId?: string;
  assignmentMethod?: EventAssignmentMethod;
  assignedRole?: EventSourceRole;
}

const LOG_ORDER: Record<ReturnType<typeof getEventIntelligenceLogLevel>, number> = {
  silent: 0,
  error: 1,
  info: 2,
  debug: 3,
};

function shouldLog(level: LogLevel) {
  return LOG_ORDER[getEventIntelligenceLogLevel()] >= LOG_ORDER[level];
}

function emit(level: LogLevel, message: string, payload: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    ts: new Date().toISOString(),
    scope: "event-intelligence",
    level,
    message,
    ...payload,
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  console.log(serialized);
}

export function createEventIntelligenceLogger(
  context: EventIntelligenceLogContext = {},
) {
  const bind = (nextContext: EventIntelligenceLogContext = {}) =>
    createEventIntelligenceLogger({
      ...context,
      ...nextContext,
    });

  return {
    child: bind,
    error(message: string, payload: Record<string, unknown> = {}) {
      emit("error", message, {
        ...context,
        ...payload,
      });
    },
    info(message: string, payload: Record<string, unknown> = {}) {
      emit("info", message, {
        ...context,
        ...payload,
      });
    },
    debug(message: string, payload: Record<string, unknown> = {}) {
      emit("debug", message, {
        ...context,
        ...payload,
      });
    },
  };
}
