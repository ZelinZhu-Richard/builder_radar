import type { IntakeRuntimeConfig } from "./types";
import type { IntakeRawPayloadMode } from "@/types";

export type IntakeLogLevel = "silent" | "error" | "info" | "debug";

const VALID_LOG_LEVELS = new Set<IntakeLogLevel>([
  "silent",
  "error",
  "info",
  "debug",
]);

const VALID_RAW_PAYLOAD_MODES = new Set<IntakeRawPayloadMode>([
  "summary",
  "full",
]);

export function getIntakeLogLevel(): IntakeLogLevel {
  const rawValue = process.env.INTAKE_LOG_LEVEL?.trim().toLowerCase();

  if (!rawValue) {
    return process.env.NODE_ENV === "production" ? "info" : "debug";
  }

  if (!VALID_LOG_LEVELS.has(rawValue as IntakeLogLevel)) {
    return process.env.NODE_ENV === "production" ? "info" : "debug";
  }

  return rawValue as IntakeLogLevel;
}

export function getIntakeRawPayloadMode(): IntakeRawPayloadMode {
  const rawValue = process.env.INTAKE_RAW_PAYLOAD_MODE?.trim().toLowerCase();

  if (!rawValue || !VALID_RAW_PAYLOAD_MODES.has(rawValue as IntakeRawPayloadMode)) {
    return "summary";
  }

  return rawValue as IntakeRawPayloadMode;
}

export function assertLiveIntakeEnv(config: IntakeRuntimeConfig) {
  if (!config.xai.apiKey) {
    throw new Error(
      "Missing XAI_API_KEY. Set it for live intake runs or enable INTAKE_USE_MOCK=true.",
    );
  }
}
