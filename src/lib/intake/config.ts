import type { SignalLane } from "@/types";
import {
  assertLiveIntakeEnv,
  getIntakeLogLevel,
  getIntakeRawPayloadMode,
} from "./env";
import type { IntakeQueryPreset, IntakeRuntimeConfig, IntakeWindow } from "./types";

const DEFAULT_REFRESH_TARGET_HOURS = 2;
const DEFAULT_LOOKBACK_HOURS = 8;
const DEFAULT_MAX_ITEMS_PER_QUERY = 5;
const DEFAULT_RAW_PAYLOAD_MAX_BYTES = 16_384;
const DEFAULT_XAI_BASE_URL = "https://api.x.ai/v1";
const DEFAULT_XAI_MODEL = "grok-4-1-fast";

export const X_DISCOVERY_PRESETS: IntakeQueryPreset[] = [
  {
    id: "ai-releases-and-evals",
    laneHint: "ai",
    queryText:
      "Find fresh AI model, API, evaluation, or tooling posts with real implementation value, first-hand detail, or credible operational implications.",
  },
  {
    id: "builder-workflows-and-infra",
    laneHint: "builders",
    queryText:
      "Find builder-facing AI workflow, agent, browser automation, memory, observability, or infra posts that change how someone can build or debug.",
  },
  {
    id: "quant-tactical-signals",
    laneHint: "quant",
    queryText:
      "Find tactical quant, breadth, factor, or AI-linked market posts with concrete positioning value instead of vague macro chatter.",
  },
  {
    id: "performance-practical-systems",
    laneHint: "performance",
    queryText:
      "Find practical performance, focus, recovery, or study-system posts with actionable guidance and credible signal, not grindset content.",
  },
];

export const WEB_DISCOVERY_PRESETS: IntakeQueryPreset[] = [
  {
    id: "ai-docs-and-launches",
    laneHint: "ai",
    queryText:
      "Find official docs, release notes, benchmarks, and serious write-ups about new AI models, tools, or evaluation methods worth tracking.",
  },
  {
    id: "builder-tooling-and-repos",
    laneHint: "builders",
    queryText:
      "Find high-signal builder tooling pages, repo launches, framework updates, and infrastructure changes that materially help AI builders.",
  },
  {
    id: "opportunities-and-programs",
    laneHint: "builders",
    queryText:
      "Find credible AI-adjacent opportunities such as grants, fellowships, hackathons, labs, design partner calls, and repos worth contributing to.",
  },
  {
    id: "performance-evidence-and-practice",
    laneHint: "performance",
    queryText:
      "Find practical and credible performance, sleep, focus, recovery, or learning-system articles with clear evidence or implementation detail.",
  },
];

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

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  return fallback;
}

export function getIntakeConfig(): IntakeRuntimeConfig {
  const refreshTargetHours = parseInteger(
    process.env.NEXT_PUBLIC_REFRESH_TARGET_HOURS,
    DEFAULT_REFRESH_TARGET_HOURS,
  );
  const lookbackHours = parseInteger(
    process.env.INTAKE_LOOKBACK_HOURS,
    Math.max(refreshTargetHours * 4, DEFAULT_LOOKBACK_HOURS),
  );

  return {
    refreshTargetHours,
    lookbackHours,
    maxItemsPerQuery: parseInteger(
      process.env.INTAKE_MAX_ITEMS_PER_QUERY,
      DEFAULT_MAX_ITEMS_PER_QUERY,
    ),
    useMockProvider: parseBoolean(
      process.env.INTAKE_USE_MOCK,
      process.env.NODE_ENV !== "production",
    ),
    logLevel: getIntakeLogLevel(),
    rawPayload: {
      mode: getIntakeRawPayloadMode(),
      maxBytes: parseInteger(
        process.env.INTAKE_RAW_PAYLOAD_MAX_BYTES,
        DEFAULT_RAW_PAYLOAD_MAX_BYTES,
      ),
    },
    xai: {
      apiKey: process.env.XAI_API_KEY,
      baseUrl: process.env.XAI_BASE_URL ?? DEFAULT_XAI_BASE_URL,
      model: process.env.XAI_MODEL ?? DEFAULT_XAI_MODEL,
    },
  };
}

export function resolveUseMockProvider(
  config: IntakeRuntimeConfig,
  override?: boolean,
) {
  const useMockProvider = override ?? config.useMockProvider;

  if (!useMockProvider) {
    assertLiveIntakeEnv(config);
  }

  return useMockProvider;
}

export function buildIntakeWindow(config: IntakeRuntimeConfig): IntakeWindow {
  const end = new Date();
  const start = new Date(end.getTime() - config.lookbackHours * 60 * 60 * 1000);

  return { start, end };
}

export function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function snapshotRuntimeConfig(config: IntakeRuntimeConfig) {
  return {
    refreshTargetHours: config.refreshTargetHours,
    lookbackHours: config.lookbackHours,
    maxItemsPerQuery: config.maxItemsPerQuery,
    useMockProvider: config.useMockProvider,
    logLevel: config.logLevel,
    rawPayload: {
      mode: config.rawPayload.mode,
      maxBytes: config.rawPayload.maxBytes,
    },
    xai: {
      baseUrl: config.xai.baseUrl,
      model: config.xai.model,
    },
  };
}

export function mergeLaneHints(...laneSets: Array<Array<SignalLane | undefined> | undefined>) {
  return Array.from(
    new Set(
      laneSets
        .flatMap((set) => set ?? [])
        .filter((lane): lane is SignalLane => Boolean(lane)),
    ),
  );
}
