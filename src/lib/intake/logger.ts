import type { IntakeQuerySource } from "@/types";
import { getIntakeLogLevel } from "./env";

type LogLevel = "error" | "info" | "debug";

interface IntakeLogContext {
  runId?: string;
  queryId?: string;
  querySource?: IntakeQuerySource;
  provider?: string;
  itemRank?: number;
}

const LOG_ORDER: Record<ReturnType<typeof getIntakeLogLevel>, number> = {
  silent: 0,
  error: 1,
  info: 2,
  debug: 3,
};

function shouldLog(messageLevel: LogLevel) {
  return LOG_ORDER[getIntakeLogLevel()] >= LOG_ORDER[messageLevel];
}

function emit(level: LogLevel, message: string, payload: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    ts: new Date().toISOString(),
    scope: "intake",
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

export function createIntakeLogger(context: IntakeLogContext = {}) {
  const bind = (nextContext: IntakeLogContext = {}) =>
    createIntakeLogger({
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
