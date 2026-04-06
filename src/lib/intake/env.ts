import type { IntakeRuntimeConfig } from "./types";

export type IntakeLogLevel = "silent" | "error" | "info" | "debug";

const VALID_LOG_LEVELS = new Set<IntakeLogLevel>([
  "silent",
  "error",
  "info",
  "debug",
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

export function assertLiveIntakeEnv(config: IntakeRuntimeConfig) {
  if (!config.xai.apiKey) {
    throw new Error(
      "Missing XAI_API_KEY. Set it for live intake runs or enable INTAKE_USE_MOCK=true.",
    );
  }
}
