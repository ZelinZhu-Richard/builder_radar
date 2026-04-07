import type { EventIntelligenceRuntimeConfig } from "./types";

const DEFAULT_MAX_CANDIDATE_EVENTS = 25;
const DEFAULT_SOFT_MATCH_LOOKBACK_DAYS = 7;
const DEFAULT_LONG_MATCH_LOOKBACK_DAYS = 30;
const DEFAULT_BREAKING_WINDOW_HOURS = 24;

type EventIntelligenceLogLevel = EventIntelligenceRuntimeConfig["logLevel"];

const VALID_LOG_LEVELS = new Set<EventIntelligenceLogLevel>([
  "silent",
  "error",
  "info",
  "debug",
]);

function parseInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getEventIntelligenceLogLevel(): EventIntelligenceLogLevel {
  const rawValue = process.env.EVENT_INTELLIGENCE_LOG_LEVEL?.trim().toLowerCase();

  if (!rawValue || !VALID_LOG_LEVELS.has(rawValue as EventIntelligenceLogLevel)) {
    const fallback = process.env.INTAKE_LOG_LEVEL?.trim().toLowerCase();
    if (fallback && VALID_LOG_LEVELS.has(fallback as EventIntelligenceLogLevel)) {
      return fallback as EventIntelligenceLogLevel;
    }

    return process.env.NODE_ENV === "production" ? "info" : "debug";
  }

  return rawValue as EventIntelligenceLogLevel;
}

export function getEventIntelligenceConfig(): EventIntelligenceRuntimeConfig {
  return {
    maxCandidateEvents: parseInteger(
      process.env.EVENT_INTELLIGENCE_MAX_CANDIDATE_EVENTS,
      DEFAULT_MAX_CANDIDATE_EVENTS,
    ),
    softMatchLookbackDays: parseInteger(
      process.env.EVENT_INTELLIGENCE_SOFT_MATCH_LOOKBACK_DAYS,
      DEFAULT_SOFT_MATCH_LOOKBACK_DAYS,
    ),
    longMatchLookbackDays: parseInteger(
      process.env.EVENT_INTELLIGENCE_LONG_MATCH_LOOKBACK_DAYS,
      DEFAULT_LONG_MATCH_LOOKBACK_DAYS,
    ),
    breakingWindowHours: parseInteger(
      process.env.EVENT_INTELLIGENCE_BREAKING_WINDOW_HOURS,
      DEFAULT_BREAKING_WINDOW_HOURS,
    ),
    logLevel: getEventIntelligenceLogLevel(),
  };
}

export function snapshotEventIntelligenceConfig(
  config: EventIntelligenceRuntimeConfig,
) {
  return {
    maxCandidateEvents: config.maxCandidateEvents,
    softMatchLookbackDays: config.softMatchLookbackDays,
    longMatchLookbackDays: config.longMatchLookbackDays,
    breakingWindowHours: config.breakingWindowHours,
    logLevel: config.logLevel,
  };
}
